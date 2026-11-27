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

const corsHeaders = (origin: string) => ({
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
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";

  // Browser origins must match the explicit allowlist. Requests without an
  // Origin header remain possible for native/server clients, but still require JWT.
  if (origin && !configuredOrigins.has(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" },
    });
  }
  if (req.method === "OPTIONS") {
    if (!origin) return new Response(null, { status: 403, headers: { "Vary": "Origin" } });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Authentication required" }, 401, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!url || !anonKey || !openaiKey) {
    return respond({ error: "Server configuration incomplete" }, 500, origin);
  }

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

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini",
      input: [
        {
          role: "system",
          content: "You are BK-BusiCare One, a practical bilingual assistant for education, career preparation, small business, digital marketing and startup planning. Reply in the user's language. State uncertainty clearly and never claim external actions were completed.",
        },
        { role: "user", content: message },
      ],
      max_output_tokens: 700,
      store: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!upstream.ok) return respond({ error: "AI provider request failed" }, 502, origin);

  const result = await upstream.json();
  const reply = (result.output ?? [])
    .flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
    .filter((item: { type?: string }) => item.type === "output_text")
    .map((item: { text?: string }) => item.text ?? "")
    .join("\n")
    .trim();
  if (!reply) return respond({ error: "AI provider returned an empty response" }, 502, origin);
  return respond({ reply }, 200, origin);
});
