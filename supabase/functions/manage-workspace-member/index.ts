import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(
  (Deno.env.get('APP_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
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
  if (origin && !allowedOrigins.has(origin)) return json(403, { error: 'Origin not allowed' });
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

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json(400, { error: 'Invalid JSON body' }, origin); }
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
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
    if (inviteError || !invited.user) {
      return json(400, { error: 'Unable to create invitation. The email may already be registered.' }, origin);
    }
    const { error: memberError } = await admin.from('workspace_members').insert({
      workspace_id: workspaceId, user_id: invited.user.id, role
    });
    if (memberError) {
      await admin.auth.admin.deleteUser(invited.user.id);
      return json(500, { error: 'Invitation could not be completed. Contact an administrator.' }, origin);
    }
    const { error: auditError } = await admin.from('audit_events').insert({
      workspace_id: workspaceId, actor_id: authData.user.id, action: 'member.invited',
      entity_type: 'workspace_member', entity_id: invited.user.id, metadata: { role }
    });
    if (auditError) {
      await admin.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', invited.user.id);
      await admin.auth.admin.deleteUser(invited.user.id);
      return json(500, { error: 'Invitation audit could not be recorded; the operation was rolled back where possible.' }, origin);
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
