import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: cors });
const readKey = (name: string, legacy?: string) => {
  const raw = Deno.env.get(name);
  if (raw) {
    try { const parsed = JSON.parse(raw); if (parsed.default) return parsed.default; } catch { return raw; }
  }
  return legacy ? Deno.env.get(legacy) || '' : '';
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const url = Deno.env.get('SUPABASE_URL') || '';
  const publishableKey = readKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secretKey = readKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !secretKey) return json(500, { error: 'Server configuration is incomplete' });

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return json(401, { error: 'Authentication required' });

  const userClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json(401, { error: 'Invalid or expired session' });

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json(400, { error: 'Invalid JSON body' }); }
  const action = input.action;
  const workspaceId = typeof input.workspace_id === 'string' ? input.workspace_id : '';
  const role = typeof input.role === 'string' ? input.role : '';
  if (!workspaceId || !['admin', 'member', 'viewer'].includes(role)) return json(400, { error: 'workspace_id and a valid role are required' });
  if (!['invite', 'set_role'].includes(String(action))) return json(400, { error: 'Unsupported action' });

  const { data: actor, error: actorError } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', workspaceId).eq('user_id', authData.user.id).maybeSingle();
  if (actorError) return json(500, { error: 'Unable to verify workspace role' });
  if (!actor || !['owner', 'admin'].includes(actor.role)) return json(403, { error: 'Workspace owner/admin permission required' });
  if (actor.role === 'admin' && role === 'admin') return json(403, { error: 'Only the workspace owner may assign admin role' });

  if (action === 'invite') {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json(400, { error: 'A valid email address is required' });
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
    if (inviteError || !invited.user) {
      return json(400, { error: inviteError?.message || 'Unable to create invitation. The email may already be registered.' });
    }
    const { error: memberError } = await admin.from('workspace_members').insert({
      workspace_id: workspaceId, user_id: invited.user.id, role
    });
    if (memberError) return json(500, { error: 'Invitation email created, but workspace membership could not be saved. Contact an administrator.' });
    await admin.from('audit_events').insert({
      workspace_id: workspaceId, actor_id: authData.user.id, action: 'member.invited',
      entity_type: 'workspace_member', entity_id: invited.user.id, metadata: { role }
    });
    return json(200, { success: true, message: 'Invitation sent' });
  }

  const targetUserId = typeof input.user_id === 'string' ? input.user_id : '';
  if (!targetUserId || targetUserId === authData.user.id) return json(400, { error: 'A different workspace member user_id is required' });
  const { data: target, error: targetError } = await admin.from('workspace_members')
    .select('role').eq('workspace_id', workspaceId).eq('user_id', targetUserId).maybeSingle();
  if (targetError) return json(500, { error: 'Unable to verify target member' });
  if (!target || target.role === 'owner') return json(403, { error: 'Target is not an editable workspace member' });
  if (actor.role === 'admin' && target.role === 'admin') return json(403, { error: 'Admins cannot change another admin role' });

  const { error: updateError } = await admin.from('workspace_members')
    .update({ role }).eq('workspace_id', workspaceId).eq('user_id', targetUserId);
  if (updateError) return json(500, { error: 'Unable to update workspace role' });
  await admin.from('audit_events').insert({
    workspace_id: workspaceId, actor_id: authData.user.id, action: 'member.role_changed',
    entity_type: 'workspace_member', entity_id: targetUserId, metadata: { from: target.role, to: role }
  });
  return json(200, { success: true, message: 'Workspace role updated' });
});
