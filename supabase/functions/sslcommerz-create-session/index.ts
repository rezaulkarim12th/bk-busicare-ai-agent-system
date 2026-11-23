import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200, origin = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req) => {
  const allowed = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",").map((v) => v.trim()).filter(Boolean);
  const requestOrigin = req.headers.get("origin") ?? "";
  const origin = allowed.includes(requestOrigin) ? requestOrigin : "";

  if (req.method === "OPTIONS") {
    if (!origin) return new Response("Origin not allowed", { status: 403 });
    return new Response("ok", { headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin } });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!origin) return json({ error: "Origin not allowed" }, 403);

  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 4096) return json({ error: "Request too large" }, 413, origin);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401, origin);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
    const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
    const mode = Deno.env.get("SSLCOMMERZ_MODE");
    if (!supabaseUrl || !anonKey || !serviceKey || !storeId || !storePassword || mode !== "sandbox") {
      return json({ error: "Sandbox payment service is not configured" }, 503, origin);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Invalid session" }, 401, origin);

    const body = await req.json().catch(() => null);
    const orderId = typeof body?.order_id === "string" ? body.order_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Valid order_id required" }, 400, origin);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: order, error: orderError } = await admin.from("orders")
      .select("id,user_id,amount,currency,status")
      .eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.user_id !== userData.user.id) return json({ error: "Order not found" }, 404, origin);
    if (order.status !== "pending" || order.currency !== "BDT" || !Number.isFinite(Number(order.amount)) || Number(order.amount) <= 0) {
      return json({ error: "Order is not payable" }, 409, origin);
    }

    const tranId = "BKC" + Date.now().toString(36).toUpperCase() + crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    const amount = Number(order.amount).toFixed(2);
    const { error: insertError } = await admin.from("payment_transactions").insert({
      order_id: order.id, tran_id: tranId, amount, currency: "BDT", status: "initiated",
    });
    if (insertError) throw insertError;

    const appBase = Deno.env.get("APP_PUBLIC_URL");
    if (!appBase || !appBase.startsWith("https://")) return json({ error: "Secure app return URL is not configured" }, 503, origin);
    const supabaseBase = supabaseUrl.replace(/\/$/, "");
    const form = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: amount,
      currency: "BDT",
      tran_id: tranId,
      product_category: "BK-BusiCare",
      product_name: "BK-BusiCare order",
      product_profile: "general",
      cus_name: "BK-BusiCare customer",
      cus_email: userData.user.email ?? "customer@example.invalid",
      cus_add1: "Not provided",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: "0000000000",
      success_url: appBase + "/payment-result?status=success",
      fail_url: appBase + "/payment-result?status=failed",
      cancel_url: appBase + "/payment-result?status=cancelled",
      ipn_url: supabaseBase + "/functions/v1/sslcommerz-ipn",
      shipping_method: "NO",
      num_of_item: "1",
    });
    const gateway = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    const gatewayData = await gateway.json().catch(() => ({}));
    if (!gateway.ok || gatewayData.status !== "SUCCESS" ||
        typeof gatewayData.GatewayPageURL !== "string" ||
        !gatewayData.GatewayPageURL.startsWith("https://")) {
      await admin.from("payment_transactions").update({ status: "failed", provider_status: String(gatewayData.status ?? "gateway_error").slice(0, 80) }).eq("tran_id", tranId);
      return json({ error: "Gateway did not create a payment session" }, 502, origin);
    }
    await admin.from("payment_transactions").update({ status: "pending", provider_status: "SESSION_CREATED" }).eq("tran_id", tranId);
    return json({ gateway_url: gatewayData.GatewayPageURL, transaction_id: tranId }, 200, origin);
  } catch (error) {
    console.error("sslcommerz-create-session", error instanceof Error ? error.message : "unknown");
    return json({ error: "Unable to start sandbox payment" }, 500, origin);
  }
});
