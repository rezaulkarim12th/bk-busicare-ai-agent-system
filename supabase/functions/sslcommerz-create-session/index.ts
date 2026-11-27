import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { readLimitedBody } from "../_shared/read-limited-body.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  const allowed = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "").split(",").map(v => v.trim()).filter(Boolean);
  const requestOrigin = req.headers.get("origin") ?? "";
  const origin = allowed.includes(requestOrigin) ? requestOrigin : "";

  if (req.method === "OPTIONS") {
    if (!origin) return new Response("Origin not allowed", { status: 403 });
    return new Response("ok", { headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin } });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!origin) return json({ error: "Origin not allowed" }, 403);

  try {
    const raw = await readLimitedBody(req, 4096);
    if (raw === null) return json({ error: "Request too large" }, 413, origin);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID") ?? "";
    const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey || !storeId || !storePassword ||
        Deno.env.get("SSLCOMMERZ_MODE") !== "sandbox") {
      return json({ error: "Sandbox payment service is not configured" }, 503, origin);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Invalid session" }, 401, origin);

    let body: { order_id?: unknown };
    try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400, origin); }
    const orderId = typeof body.order_id === "string" ? body.order_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Valid order_id required" }, 400, origin);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,user_id,amount,currency,status,items_snapshot,customer_name,customer_email,customer_phone,customer_address,customer_city,customer_country")
      .eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.user_id !== userData.user.id) return json({ error: "Order not found" }, 404, origin);
    const amountNumber = Number(order.amount);
    if (order.status !== "pending" || order.currency !== "BDT" ||
        !Number.isFinite(amountNumber) || amountNumber < 10 || amountNumber > 500000) {
      return json({ error: "Order is not payable or is outside provider amount limits" }, 409, origin);
    }
    const customer = [order.customer_name, order.customer_email, order.customer_phone,
      order.customer_address, order.customer_city, order.customer_country];
    if (customer.some(v => typeof v !== "string" || !v.trim()) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer_email) ||
        !/^[0-9+() -]{6,24}$/.test(order.customer_phone)) {
      return json({ error: "Order customer details are incomplete" }, 422, origin);
    }
    if (!Array.isArray(order.items_snapshot) || order.items_snapshot.length < 1 || order.items_snapshot.length > 50) {
      return json({ error: "Order item snapshot is invalid" }, 422, origin);
    }

    const appBase = Deno.env.get("APP_PUBLIC_URL") ?? "";
    let appUrl: URL;
    try { appUrl = new URL(appBase); } catch { return json({ error: "Secure app return URL is not configured" }, 503, origin); }
    if (appUrl.protocol !== "https:" || appUrl.origin !== requestOrigin || appUrl.search || appUrl.hash) {
      return json({ error: "App return URL must match the approved HTTPS origin" }, 503, origin);
    }

    // Do not create another provider session while this order already has
    // an initiated or pending transaction. The partial unique index below is
    // the concurrency-safe guard; this read gives the normal retry a clear 409.
    const { data: activeTransaction, error: activeTransactionError } = await admin
      .from("payment_transactions")
      .select("id,status")
      .eq("order_id", order.id)
      .in("status", ["initiated", "pending"])
      .limit(1)
      .maybeSingle();
    if (activeTransactionError) throw activeTransactionError;
    if (activeTransaction) {
      return json({ error: "A payment session is already active for this order" }, 409, origin);
    }

    const tranId = "BKC" + Date.now().toString(36).toUpperCase() +
      crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const amount = amountNumber.toFixed(2);
    const { error: insertError } = await admin.from("payment_transactions").insert({
      order_id: order.id, tran_id: tranId, amount, currency: "BDT", status: "initiated",
    });
    // 23505 is expected if two requests race; the database index guarantees
    // that only one request can own an active transaction for this order.
    if (insertError?.code === "23505") {
      return json({ error: "A payment session is already active for this order" }, 409, origin);
    }
    if (insertError) throw insertError;

    const supabaseBase = supabaseUrl.replace(/\/$/, "");
    const form = new URLSearchParams({
      store_id: storeId, store_passwd: storePassword, total_amount: amount,
      currency: "BDT", tran_id: tranId, product_category: "BK-BusiCare",
      product_name: "BK-BusiCare order", product_profile: "general",
      cus_name: order.customer_name, cus_email: order.customer_email,
      cus_add1: order.customer_address, cus_city: order.customer_city,
      cus_country: order.customer_country, cus_phone: order.customer_phone,
      success_url: appBase + "/payment-result?status=success",
      fail_url: appBase + "/payment-result?status=failed",
      cancel_url: appBase + "/payment-result?status=cancelled",
      ipn_url: supabaseBase + "/functions/v1/sslcommerz-ipn",
      shipping_method: "NO", num_of_item: String(order.items_snapshot.length),
    });
    let gateway: Response;
    try {
      gateway = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form, signal: AbortSignal.timeout(15000),
      });
    } catch {
      await admin.from("payment_transactions").update({
        status: "failed", provider_status: "GATEWAY_REQUEST_FAILED",
      }).eq("tran_id", tranId).eq("status", "initiated");
      return json({ error: "Payment provider could not be reached; you may retry" }, 502, origin);
    }
    const gatewayData = await gateway.json().catch(() => ({}));
    if (!gateway.ok || gatewayData.status !== "SUCCESS" ||
        typeof gatewayData.GatewayPageURL !== "string" ||
        new URL(gatewayData.GatewayPageURL).protocol !== "https:") {
      await admin.from("payment_transactions").update({
        status: "failed", provider_status: String(gatewayData.status ?? "gateway_error").slice(0, 80),
      }).eq("tran_id", tranId);
      return json({ error: "Gateway did not create a payment session" }, 502, origin);
    }
    await admin.from("payment_transactions").update({ status: "pending", provider_status: "SESSION_CREATED" }).eq("tran_id", tranId);
    return json({ gateway_url: gatewayData.GatewayPageURL, transaction_id: tranId }, 200, origin);
  } catch (error) {
    console.error("sslcommerz-create-session", error instanceof Error ? error.message : "unknown");
    return json({ error: "Unable to start sandbox payment" }, 500, origin);
  }
});
