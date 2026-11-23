import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const headers = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function response(body: unknown, status: number, origin: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Access-Control-Allow-Origin": origin,
      "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req) => {
  const origins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "").split(",").map(v => v.trim()).filter(Boolean);
  const origin = req.headers.get("origin") ?? "";
  if (!origins.includes(origin)) return new Response("Origin not allowed", { status: 403 });
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: { ...headers, "Access-Control-Allow-Origin": origin },
  });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  try {
    const raw = await req.text();
    if (raw.length > 8192) return response({ error: "Request too large" }, 413, origin);
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return response({ error: "Authentication required" }, 401, origin);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anon || !service) return response({ error: "Order service is not configured" }, 503, origin);

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return response({ error: "Invalid session" }, 401, origin);

    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { return response({ error: "Invalid JSON" }, 400, origin); }
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
      return response({ error: "Select between 1 and 50 catalogue items" }, 422, origin);
    }
    const customer = body.customer as Record<string, unknown> | undefined;
    const fields = ["name", "email", "phone", "address", "city", "country"] as const;
    if (!customer || fields.some(k => typeof customer[k] !== "string" ||
      !(customer[k] as string).trim() || (customer[k] as string).length > 254)) {
      return response({ error: "Complete customer details are required" }, 422, origin);
    }
    const email = String(customer.email).trim();
    const phone = String(customer.phone).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[0-9+() -]{6,24}$/.test(phone)) {
      return response({ error: "Customer email or phone format is invalid" }, 422, origin);
    }

    const requested = new Map<string, number>();
    for (const item of body.items) {
      if (!item || typeof item !== "object" || typeof item.product_id !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(item.product_id) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return response({ error: "Each item needs a valid product_id and quantity from 1 to 10" }, 422, origin);
      }
      requested.set(item.product_id, (requested.get(item.product_id) ?? 0) + item.quantity);
    }
    if ([...requested.values()].some(q => q > 10)) return response({ error: "Item quantity limit exceeded" }, 422, origin);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: products, error: productsError } = await admin.from("product_catalog")
      .select("id,sku,name,kind,unit_price,currency,active")
      .in("id", [...requested.keys()]).eq("active", true);
    if (productsError) throw productsError;
    if (!products || products.length !== requested.size) {
      return response({ error: "One or more catalogue items are unavailable" }, 409, origin);
    }

    let totalCents = 0;
    const snapshot = products.map(p => {
      const cents = Math.round(Number(p.unit_price) * 100);
      const quantity = requested.get(p.id)!;
      totalCents += cents * quantity;
      return { product_id: p.id, sku: p.sku, name: p.name, kind: p.kind,
        unit_price: (cents / 100).toFixed(2), quantity, currency: p.currency };
    });
    if (!Number.isSafeInteger(totalCents) || totalCents < 1000 || totalCents > 50000000) {
      return response({ error: "Order total is outside the supported BDT range" }, 422, origin);
    }

    const { data: order, error: insertError } = await admin.from("orders").insert({
      user_id: authData.user.id,
      currency: "BDT",
      amount: (totalCents / 100).toFixed(2),
      items_snapshot: snapshot,
      customer_name: String(customer.name).trim(),
      customer_email: email,
      customer_phone: phone,
      customer_address: String(customer.address).trim(),
      customer_city: String(customer.city).trim(),
      customer_country: String(customer.country).trim(),
      status: "pending",
    }).select("id,amount,currency,status,created_at").single();
    if (insertError) throw insertError;
    return response({ order }, 201, origin);
  } catch (error) {
    console.error("busicare-create-order", error instanceof Error ? error.message : "unknown");
    return response({ error: "Unable to create order" }, 500, origin);
  }
});
