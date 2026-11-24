import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const json = (body: Record<string, unknown>, status: number, origin: string) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json", "Cache-Control": "no-store" } });
const allowedPlatforms = new Set(["Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube"]);
const maxBodyBytes = 12_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const readLimitedBody = async (req: Request): Promise<string | null> => {
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBodyBytes) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
};

Deno.serve(async (req: Request) => {
  const configuredOrigins = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") {
    if (!origin || !configuredOrigins.includes(origin)) return new Response(null, { status: 403, headers: { "Vary": "Origin" } });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin || "null");
  if (!origin || !configuredOrigins.includes(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

  const token = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) return json({ error: "Server authentication is not configured" }, 503, origin);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401, origin);

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength > maxBodyBytes) return json({ error: "Request too large" }, 413, origin);
  let rawBody: string | null;
  try { rawBody = await readLimitedBody(req); } catch { return json({ error: "Unable to read request body" }, 400, origin); }
  if (rawBody === null) return json({ error: "Request too large" }, 413, origin);
  let payload: unknown;
  try { payload = JSON.parse(rawBody); } catch { return json({ error: "Invalid JSON" }, 400, origin); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return json({ error: "Invalid request" }, 400, origin);

  const input = payload as Record<string, unknown>;
  const workspaceId = typeof input.workspace_id === "string" ? input.workspace_id : "";
  if (!uuidPattern.test(workspaceId)) return json({ error: "A valid workspace_id is required" }, 400, origin);

  // Enforce workspace membership and role on the server; UI-only checks are not authorization.
  const { data: membership, error: membershipError } = await admin.from("workspace_members")
    .select("role").eq("workspace_id", workspaceId).eq("user_id", authData.user.id).maybeSingle();
  if (membershipError) {
    console.error("AI workspace authorization lookup failed", { code: membershipError.code });
    return json({ error: "Unable to verify workspace permissions" }, 503, origin);
  }
  if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
    return json({ error: "Workspace membership with content-generation permission is required" }, 403, origin);
  }

  const topic = typeof input.topic === "string" ? input.topic.trim() : "";
  const platform = typeof input.platform === "string" ? input.platform : "";
  const audience = typeof input.audience === "string" ? input.audience.trim().slice(0, 240) : "General audience";
  const objective = typeof input.objective === "string" ? input.objective.trim().slice(0, 240) : "Useful, accurate engagement";
  const offer = typeof input.offer === "string" ? input.offer.trim().slice(0, 300) : "";
  if (!topic || topic.length > 500 || !allowedPlatforms.has(platform)) return json({ error: "Provide a topic (max 500 characters) and a supported platform" }, 400, origin);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) return json({ error: "AI provider is not configured" }, 503, origin);

  const { data: quotaAllowed, error: quotaError } = await admin.rpc("reserve_ai_content_generation", { target_actor: authData.user.id });
  if (quotaError) { console.error("AI quota reservation failed", { code: quotaError.code }); return json({ error: "Usage limit service temporarily unavailable" }, 503, origin); }
  if (quotaAllowed !== true) return json({ error: "AI usage limit reached. Try again later." }, 429, origin);

  const prompt = [
    "Create one accurate, non-deceptive social media draft.",
    "Do not invent prices, guarantees, credentials, statistics, testimonials, or product claims.",
    "If essential facts are missing, use clear placeholders rather than guessing.",
    "Return a hook, concise body, one CTA, five relevant hashtags, and one alternate headline.",
    "Do not publish, message users, spend money, or invoke tools.",
    `Platform: ${platform}`, `Topic: ${topic}`, `Audience: ${audience}`, `Objective: ${objective}`,
    `Offer or verified facts: ${offer || "Not provided"}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: prompt, max_output_tokens: 1200, store: false }),
      signal: AbortSignal.timeout(25_000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("OpenAI request failed", { status: response.status, requestId: response.headers.get("x-request-id") });
      return json({ error: "AI provider request failed" }, 502, origin);
    }
    const output = Array.isArray(result.output) ? result.output : [];
    const text = output.flatMap((item: Record<string, unknown>) => item.type === "message" && Array.isArray(item.content) ? item.content : [])
      .filter((item: Record<string, unknown>) => item.type === "output_text" && typeof item.text === "string")
      .map((item: Record<string, unknown>) => item.text as string).join("\n").trim();
    if (!text) return json({ error: "AI provider returned no text" }, 502, origin);
    return json({ text, provider: "openai", published: false }, 200, origin);
  } catch (error) {
    console.error("AI request unavailable", error instanceof Error ? error.name : "unknown");
    return json({ error: "AI service temporarily unavailable" }, 503, origin);
  }
});
