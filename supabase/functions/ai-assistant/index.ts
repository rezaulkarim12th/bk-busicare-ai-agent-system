import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const configuredOrigins = new Set([
  "https://localhost",
  "https://rezaulkarim12th.github.io",
  "https://busicarecom.wordpress.com",
  "https://bk-busicare.com",
  "https://go.bk-busicare.com",
  ...(Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
]);

const cors = (origin = "") => ({
  ...(origin && configuredOrigins.has(origin)
    ? { "Access-Control-Allow-Origin": origin }
    : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const respond = (data: unknown, status = 200, origin = "") =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  if (origin && !configuredOrigins.has(origin)) {
    return respond({ error: "Origin not allowed" }, 403);
  }
  if (req.method === "OPTIONS") {
    if (!origin || !configuredOrigins.has(origin)) {
      return new Response(null, { status: 403, headers: { "Vary": "Origin" } });
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Authentication required" }, 401, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) return respond({ error: "Server configuration incomplete" }, 500, origin);

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return respond({ error: "Invalid session" }, 401, origin);

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON" }, 400, origin);
  }
  if (typeof body.message !== "string") {
    return respond({ error: "message must be a string" }, 400, origin);
  }
  const message = body.message.trim();
  if (!message || message.length > 4000) {
    return respond({ error: "message length must be 1–4000 characters" }, 400, origin);
  }

  // The deployed v3 source ends after request validation and contains no AI provider call.
  // Keep this security-only patch behavior-preserving; implement AI responses in a separate,
  // explicitly tested feature change rather than silently introducing new runtime behavior.
  return respond({ error: "AI assistant handler is not implemented in deployed v3" }, 501, origin);
});
