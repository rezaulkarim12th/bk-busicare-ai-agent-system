import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function reply(status = 200) {
  return new Response(status === 200 ? "OK" : "Rejected", {
    status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return reply(405);
  try {
    const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
    const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!storeId || !storePassword || !supabaseUrl || !serviceKey ||
        Deno.env.get("SSLCOMMERZ_MODE") !== "sandbox") return reply(503);

    const raw = await req.text();
    if (raw.length > 16384) return reply(413);
    const params = new URLSearchParams(raw);
    const tranId = params.get("tran_id") ?? "";
    const valId = params.get("val_id") ?? "";
    if (!tranId || !valId || tranId.length > 50 || valId.length > 50 || params.get("store_id") !== storeId) return reply(400);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: tx, error: txError } = await admin.from("payment_transactions")
      .select("id,order_id,tran_id,amount,currency,status")
      .eq("tran_id", tranId).maybeSingle();
    if (txError) throw txError;
    if (!tx) return reply(404);

    const validationUrl = new URL("https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php");
    validationUrl.search = new URLSearchParams({
      val_id: valId, store_id: storeId, store_passwd: storePassword, v: "1", format: "json",
    }).toString();
    const validationResponse = await fetch(validationUrl, { signal: AbortSignal.timeout(15000) });
    const validation = await validationResponse.json().catch(() => ({}));
    const valid = validationResponse.ok && (validation.status === "VALID" || validation.status === "VALIDATED") &&
      String(validation.tran_id) === tranId && String(validation.val_id) === valId &&
      Number(validation.amount).toFixed(2) === Number(tx.amount).toFixed(2) &&
      String(validation.currency_type) === tx.currency;
    if (!valid) {
      if (tx.status === "initiated" || tx.status === "pending") {
        await admin.from("payment_transactions").update({
          status: "failed", provider_status: "VALIDATION_MISMATCH",
        }).eq("id", tx.id).in("status", ["initiated", "pending"]);
      }
      return reply(400);
    }

    const riskLevel = Number(validation.risk_level ?? 0);
    const needsReview = riskLevel === 1;
    const finalStatus = needsReview ? "manual_review" : "validated";
    if (tx.status !== "validated" && tx.status !== "manual_review") {
      const { error: updateTxError } = await admin.from("payment_transactions").update({
        status: finalStatus, val_id: valId, risk_level: riskLevel,
        provider_status: String(validation.status).slice(0, 80),
        validation_payload: {
          tran_id: tranId, val_id: valId, amount: validation.amount,
          currency_type: validation.currency_type, risk_level: riskLevel,
        },
      }).eq("id", tx.id).in("status", ["initiated", "pending"]);
      if (updateTxError) throw updateTxError;
    }

    // Reconcile the order on duplicate IPNs too, so a retry repairs a prior partial update.
    const orderStatus = (tx.status === "manual_review" || needsReview) ? "manual_review" : "paid";
    const { error: orderUpdateError } = await admin.from("orders").update({
      status: orderStatus, updated_at: new Date().toISOString(),
    }).eq("id", tx.order_id).eq("status", "pending");
    if (orderUpdateError) throw orderUpdateError;
    return reply(200);
  } catch (error) {
    console.error("sslcommerz-ipn", error instanceof Error ? error.message : "unknown");
    return reply(500);
  }
});
