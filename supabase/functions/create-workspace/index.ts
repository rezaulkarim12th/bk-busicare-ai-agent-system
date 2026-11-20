import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(
  (Deno.env.get('APP_ALLOWED_ORIGINS') || '')
    .split(',').map((value) => value.trim()).filter(Boolean)
);

function readKey(name: string, legacy?: string) {
  const raw = Deno.env.get(name);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.default) return parsed.default;
    } catch {
      return raw;
    }
  }
  return legacy ? Deno.env.get(legacy) || '' : '';
}

function json(status: number, body: Record<string, unknown>, origin = '') {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  if (!origin || allowedOrigins.size === 0 || !allowedOrigins.has(origin)) return json(403, { error: 'Origin not allowed or APP_ALLOWED_ORIGINS is not configured' });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    ...(origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {})
  }});
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, origin);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const publishableKey = readKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secretKey = readKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !secretKey) {
    return json(500, { error: 'Server configuration is incomplete' }, origin);
  }

  const authorization = req.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json(401, { error: 'Authentication required' }, origin);

  const userClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: 'Invalid or expired session' }, origin);

  let input: Record<string, unknown>;
  try { input = await req.json(); }
  catch { return json(400, { error: 'Invalid JSON body' }, origin); }

  const name = typeof input.workspace_name === 'string' ? input.workspace_name.trim() : '';
  if (name.length < 2 || name.length > 120) {
    return json(400, { error: 'Workspace name must contain 2 to 120 characters' }, origin);
  }

  const { data: workspaceId, error } = await admin.rpc('create_workspace_for_user', {
    workspace_name: name,
    target_user: authData.user.id
  });
  if (error || !workspaceId) {
    const message = error?.message || 'Workspace creation failed';
    const status = /already belongs|already has a workspace/i.test(message) ? 409 : 400;
    return json(status, { error: status === 409 ? 'A workspace is already linked to this account.' : 'Workspace could not be created.' }, origin);
  }

  return json(200, { success: true, workspace_id: workspaceId }, origin);
});
