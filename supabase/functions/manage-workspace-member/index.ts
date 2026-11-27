import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://localhost',
  'https://rezaulkarim12th.github.io',
  'https://busicarecom.wordpress.com',
  'https://bk-busicare.com',
  'https://go.bk-busicare.com',
  ...(Deno.env.get('APP_ALLOWED_ORIGINS') || '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);
// Capacitor Android serves the app from this exact HTTPS origin.
allowedOrigins.add('https://localhost');
const MAX_BODY_BYTES = 12_000;
async function readJsonObject(req: Request): Promise<Record<string, unknown> | null | undefined> {
  const declaredLength = Number(req.headers.get('content-length') || '0');
  if (declaredLength > MAX_BODY_BYTES) return null;
  const reader = req.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(bytes)); } catch { return undefined; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  return parsed as Record<string, unknown>;
}

const responseHeaders = (origin = '') => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
};
const json = (status: number, body: Record<string, unknown>, origin = '') =>
  new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
const readKey = (name: string, legacy?: string) => {
  const raw = Deno.env.get(name);
  if (raw) {
    try { const parsed = JSON.parse(raw); if (parsed.default) return parsed.default; } catch { return raw; }
  }
  return legacy ? Deno.env.get(legacy) || '' : '';
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  if (!origin || allowedOrigins.size === 0 || !allowedOrigins.has(origin)) return json(403, { error: 'Origin not allowed or APP_ALLOWED_ORIGINS is not configured' });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders(origin) });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' }, origin);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const publishableKey = readKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secretKey = readKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !secretKey) return json(500, { error: 'Server configuration is incomplete' }, origin);

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json(401, { error: 'Authentication required' }, origin);

  const userClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: 'Invalid or expired session' }, origin);

  const input = await readJsonObject(req);
  if (input === null) return json(413, { error: 'Request too large' }, origin);
  if (!input) return json(400, { error: 'Invalid JSON object' }, origin);
  const action = input.action;
  const workspaceId = typeof input.workspace_id === 'string' ? input.workspace_id : '';
  const role = typeof input.role === 'string' ? input.role : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceId) || !['admin', 'member', 'viewer'].includes(role)) return json(400, { error: 'workspace_id and a valid role are required' }, origin);
  if (!['invite', 'set_role'].includes(String(action))) return json(400, { error: 'Unsupported action' }, origin);

  const { data: actor, error: actorError } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', workspaceId).eq('user_id', authData.user.id).maybeSingle();
  if (actorError) return json(500, { error: 'Unable to verify workspace role' }, origin);
  if (!actor || !['owner', 'admin'].includes(actor.role)) return json(403, { error: 'Workspace owner/admin permission required' }, origin);
  if (actor.role === 'admin' && role === 'admin') return json(403, { error: 'Only the workspace owner may assign admin role' }, origin);

  if (action === 'invite') {
    // Reject malformed input before consuming a rate-limit reservation.
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json(400, { error: 'A valid email address is required' }, origin);
    const { data: invitationAllowed, error: rateError } = await admin.rpc('reserve_workspace_invitation', {
      target_workspace: workspaceId,
      target_actor: authData.user.id
    });
    if (rateError) return json(500, { error: 'Unable to verify invitation rate limit' }, origin);
    if (invitationAllowed !== true) return json(429, { error: 'Invitation limit reached. Try again later.' }, origin);
    const redirectTo = Deno.env.get('APP_REDIRECT_URL') || 'https://rezaulkarim12th.github.io/bk-busicare-ai-agent-system/';
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (inviteError || !invited.user) {
      return json(400, { error: 'Unable to create invitation. The email may already be registered.' }, origin);
    }
    // Membership authorization and audit insertion are one database transaction.
    const { data: membershipCreated, error: membershipError } = await admin.rpc('add_workspace_member_invitation', {
      target_workspace: workspaceId,
      target_actor: authData.user.id,
      target_user: invited.user.id,
      target_role: role
    });
    if (membershipError || membershipCreated !== true) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(invited.user.id);
      return json(500, {
        error: cleanupError
          ? 'Invitation setup failed; an unused Auth account may require administrator cleanup.'
          : 'Invitation could not be completed; the unused Auth account was removed.'
      }, origin);
    }
    return json(200, { success: true, message: 'Invitation sent' }, origin);
  }

  const targetUserId = typeof input.user_id === 'string' ? input.user_id : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId) || targetUserId === authData.user.id) return json(400, { error: 'A different workspace member user_id is required' }, origin);
  const { data: target, error: targetError } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', workspaceId).eq('user_id', targetUserId).maybeSingle();
  if (targetError) return json(500, { error: 'Unable to verify target member' }, origin);
  if (!target || target.role === 'owner') return json(403, { error: 'Target is not an editable workspace member' }, origin);
  if (actor.role === 'admin' && target.role === 'admin') return json(403, { error: 'Admins cannot change another admin role' }, origin);

  // Re-check authorization and write the role + audit event in one database transaction.
  // This closes the race between the earlier UI-friendly checks and the privileged write.
  const { data: changed, error: changeError } = await admin.rpc('set_workspace_member_role', {
    target_workspace: workspaceId,
    target_actor: authData.user.id,
    target_user: targetUserId,
    target_role: role
  });
  if (changeError || changed !== true) {
    return json(403, { error: 'Role change is not permitted or could not be recorded' }, origin);
  }
  return json(200, { success: true, message: 'Workspace role updated' }, origin);
});
