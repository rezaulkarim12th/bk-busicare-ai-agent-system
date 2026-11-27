import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationFiles = ['20261120044848_multitenant_foundation.sql', '20261120044911_performance_hardening.sql', '20261120105527_production_team_management_rpcs.sql'];
const sql = (await Promise.all(migrationFiles.map(file => readFile(new URL('../supabase/migrations/' + file, import.meta.url), 'utf8')))).join('\n');
const normalized = sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').toLowerCase();
const portal = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const teamFunction = await readFile(new URL('../supabase/functions/manage-workspace-member/index.ts', import.meta.url), 'utf8');

test('creates all workspace-scoped operational tables with RLS enabled', () => {
  for (const table of ['workspaces','workspace_members','leads','content_items','audit_events']) {
    assert.match(normalized, new RegExp('create table if not exists public\\.' + table + '\\b'));
    assert.match(normalized, new RegExp('alter table public\\.' + table + ' enable row level security'));
  }
});

test('table grants are least-privilege and RLS remains the row authorization layer', () => {
  assert.match(normalized, /revoke all on table public\.workspaces, public\.workspace_members, public\.leads, public\.content_items, public\.audit_events from public, anon, authenticated/);
  assert.match(normalized, /grant select on table public\.workspaces to authenticated/);
  assert.match(normalized, /grant update \(name\) on table public\.workspaces to authenticated/);
  assert.match(normalized, /grant select on table public\.workspace_members to authenticated/);
  assert.match(normalized, /grant select on table public\.audit_events to authenticated/);
});

test('authorization helpers are private, non-API functions with a locked search path', () => {
  assert.match(normalized, /create schema if not exists private/);
  assert.match(normalized, /create or replace function private\.is_workspace_member\(target_workspace uuid\)[\s\S]*?set search_path = ''/);
  assert.match(normalized, /create or replace function private\.has_workspace_role\(target_workspace uuid, allowed_roles text\[\]\)[\s\S]*?set search_path = ''/);
  assert.match(normalized, /create or replace function public\.reserve_workspace_invitation\(target_workspace uuid, target_actor uuid\)/);
  assert.match(normalized, /revoke all on schema private from public, anon, authenticated/);
  assert.match(normalized, /grant usage on schema private to authenticated/);
  assert.match(normalized, /grant execute on function private\.is_workspace_member\(uuid\) to authenticated/);
});

test('workspace creation requires authentication and atomically assigns owner role', () => {
  assert.match(normalized, /create or replace function public\.create_workspace\(workspace_name text\)/);
  assert.match(normalized, /if caller_id is null then raise exception 'authentication required'/);
  assert.match(normalized, /values \(new_workspace_id, caller_id, 'owner'\)/);
  assert.match(normalized, /revoke all on function public\.reserve_workspace_invitation\(uuid, uuid\) from public, anon, authenticated/);
  assert.match(normalized, /grant execute on function public\.reserve_workspace_invitation\(uuid, uuid\) to service_role/);
});

test('lead and content access is scoped to workspace membership and role', () => {
  assert.match(normalized, /create policy "members can view leads" on public\.leads for select to authenticated using \(private\.is_workspace_member\(workspace_id\)\)/);
  assert.match(normalized, /create policy "members can view content" on public\.content_items for select to authenticated using \(private\.is_workspace_member\(workspace_id\)\)/);
  assert.match(normalized, /private\.has_workspace_role\(workspace_id, array\['owner','admin','member'\]\)/);
});

test('record tenant identity is immutable and updated_at is refreshed', () => {
  assert.match(normalized, /new\.workspace_id is distinct from old\.workspace_id/);
  assert.match(normalized, /new\.created_by is distinct from old\.created_by/);
  assert.match(normalized, /new\.updated_at := now\(\)/);
  assert.match(normalized, /create trigger leads_guard_identity before update on public\.leads/);
  assert.match(normalized, /create trigger content_guard_identity before update on public\.content_items/);
});

test('RLS policy migration is re-runnable when policies already exist', () => {
  const policyPairs = [
    ['workspace members can view workspaces', 'public.workspaces'],
    ['workspace admins can update workspaces', 'public.workspaces'],
    ['members can view workspace membership', 'public.workspace_members'],
    ['members can view leads', 'public.leads'],
    ['contributors can create leads', 'public.leads'],
    ['contributors can update leads', 'public.leads'],
    ['admins can delete leads', 'public.leads'],
    ['members can view content', 'public.content_items'],
    ['contributors can create content', 'public.content_items'],
    ['contributors can update content', 'public.content_items'],
    ['admins can delete content', 'public.content_items'],
    ['admins can read audit events', 'public.audit_events']
  ];
  for (const [name, table] of policyPairs) {
    const expected = 'drop policy if exists "' + name + '" on ' + table + '; create policy "' + name + '"';
    assert.ok(normalized.includes(expected), 'Policy must be safely replaced: ' + name);
  }
});

test('audit events are read-only to browser clients', () => {
  assert.match(normalized, /create policy "admins can read audit events" on public\.audit_events for select/);
  assert.doesNotMatch(normalized, /create policy[^;]*on public\.audit_events for (insert|update|delete)/);
});

test('workspace membership cannot be mutated by browser clients', () => {
  assert.doesNotMatch(normalized, /create policy[^;]*on public\.workspace_members for (insert|update|delete)/);
});

test('auth portal supports recovery and fails closed on partial Supabase configuration', () => {
  assert.match(portal, /VITE_SUPABASE_URL/);
  assert.match(portal, /VITE_SUPABASE_ANON_KEY/);
  assert.match(portal, /signInWithPassword/);
  assert.match(portal, /signUp/);
  assert.match(portal, /PASSWORD_RECOVERY/);
  assert.match(portal, /passwordUpdateView\(\)/);
  assert.match(portal, /passwordRecoveryPending/);
  assert.match(portal, /hasUrl !== hasKey/);
  assert.doesNotMatch(portal, /SERVICE_ROLE_KEY|service_role|SUPABASE_DB_PASSWORD/);
});

test('authenticated portal performs workspace-scoped cloud Leads and Content CRUD', () => {
  for (const token of ["from('leads').select", "from('content_items').select", "from('leads').insert(payload)", "from('content_items').insert(payload)", "from('leads').update", "from('content_items').update", "from(table).delete()", ".eq('workspace_id',activeId)", "created_by:session.user.id"]) {
    assert.ok(portal.includes(token), 'Missing cloud data operation: ' + token);
  }
  assert.match(portal, /function loadRecords\(\)/);
  assert.match(portal, /function bindDataActions\(\)/);
  assert.doesNotMatch(portal, /SERVICE_ROLE_KEY|service_role|SUPABASE_DB_PASSWORD/);
});

test('team management runs through an authenticated, role-checked Edge Function', () => {
  assert.match(teamFunction, /auth\.getUser\(token\)/);
  assert.match(teamFunction, /workspace_members/);
  assert.match(teamFunction, /\['owner', 'admin'\]/);
  assert.match(teamFunction, /Only the workspace owner may assign admin role/);
  assert.match(teamFunction, /Invitation limit reached/);
  assert.match(teamFunction, /reserve_workspace_invitation/);
  assert.match(teamFunction, /APP_ALLOWED_ORIGINS/);
  assert.doesNotMatch(teamFunction, /Access-Control-Allow-Origin': '\*'/);
  assert.match(teamFunction, /admin\.rpc\('add_workspace_member_invitation'/);
  assert.match(teamFunction, /admin\.rpc\('set_workspace_member_role'/);
  assert.match(teamFunction, /deleteUser\(invited\.user\.id\)/);
  assert.match(teamFunction, /inviteUserByEmail/);
  assert.match(normalized, /insert into public\.audit_events/);
  assert.match(portal, /functions\.invoke\('manage-workspace-member'/);
  assert.match(portal, /action:'set_role'/);
  assert.match(portal, /action:'invite'/);
  assert.doesNotMatch(teamFunction, /console\.log\([^)]*(secret|key|token)/i);
});

test('authenticated or partially configured mode never renders the local demo', () => {
  assert.match(app, /const hasSupabaseUrl=Boolean\(import\.meta\.env\.VITE_SUPABASE_URL\?\.trim\(\)\)/);
  assert.match(app, /const hasSupabaseKey=Boolean\(import\.meta\.env\.VITE_SUPABASE_ANON_KEY\?\.trim\(\)\)/);
  assert.match(app, /if \(!hasSupabaseUrl && !hasSupabaseKey\) render\(\)/);
});

test('backup import validates records and CSV export mitigates formula injection', () => {
  assert.match(app, /Number\.isSafeInteger\(Number\(l\.id\)\)/);
  assert.match(app, /contentOk=Array\.isArray\(incoming\?\.content\)/);
  assert.match(app, /function csvCell\(value\)/);
  assert.ok(app.includes("rows.map(r=>r.map(csvCell).join(','))"));
  assert.match(app, /\[=\+@-\]/);
  assert.match(app, /data-edit-lead="\$\{esc\(l\.id\)\}"/);
});

test('invitation attempts are rate-limited atomically and only the service role can reserve them', () => {
  assert.ok(normalized.includes('create or replace function public.reserve_workspace_invitation(target_workspace uuid, target_actor uuid)'));
  assert.ok(normalized.includes("coalesce(auth.role(), '') <> 'service_role'"));
  assert.ok(normalized.includes('pg_advisory_xact_lock'));
  assert.ok(normalized.includes("member.invitation_attempted"));
  assert.ok(normalized.includes('recent_attempts >= 5'));
  assert.ok(normalized.includes('revoke all on function public.reserve_workspace_invitation(uuid, uuid) from public, anon, authenticated'));
  assert.ok(normalized.includes('grant execute on function public.reserve_workspace_invitation(uuid, uuid) to service_role'));
  const emailValidation = teamFunction.indexOf('A valid email address is required');
  const rateReservation = teamFunction.indexOf("admin.rpc('reserve_workspace_invitation'");
  assert.ok(emailValidation >= 0 && rateReservation > emailValidation, 'Invalid email input must not consume an invitation rate-limit reservation');
});


test('invitation quota SQL function uses a valid dollar-quoted body', () => {
  const functionStart = sql.lastIndexOf('create or replace function public.reserve_workspace_invitation');
  const functionEnd = sql.indexOf('revoke all on function public.reserve_workspace_invitation', functionStart);
  const functionSql = sql.slice(functionStart, functionEnd);
  assert.match(functionSql, /as \$\$\s+declare/);
  assert.match(functionSql, /end;\s+\$\$;/);
});

test('team invitation email validation rejects whitespace', () => {
  assert.ok(teamFunction.includes("/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)"));
});

test('signup and password recovery enforce a 12-character minimum in the client', () => {
  assert.match(portal, /mode === 'signup' && password\.length < 12/);
  assert.match(portal, /password\.length < 12/);
});

test('all SECURITY DEFINER functions pin an empty search_path', () => {
  const definitions = [...normalized.matchAll(/create or replace function ([a-z0-9_.]+)\([^)]*\)[\s\S]*?\$\$/g)];
  for (const match of definitions) {
    const declaration = match[0];
    if (/security definer/.test(declaration)) {
      assert.match(declaration, /set search_path = ''/, 'SECURITY DEFINER function must pin search_path: ' + match[1]);
    }
  }
});

test('browser roles cannot write membership or audit tables and anonymous table access is revoked', () => {
  assert.match(normalized, /from public, anon, authenticated/);
  assert.doesNotMatch(normalized, /grant (insert|update|delete|all) on table public\.workspace_members to authenticated/);
  assert.doesNotMatch(normalized, /grant (insert|update|delete|all) on table public\.audit_events to authenticated/);
});


test('local demo safely recovers from malformed browser storage and rejects invalid records', () => {
  assert.match(app, /JSON\.parse\(localStorage\.getItem\(KEY\) \|\| 'null'\)/);
  assert.match(app, /Array\.isArray\(stored\.leads\)/);
  assert.match(app, /Array\.isArray\(stored\.content\)/);
  assert.match(app, /Number\.isSafeInteger\(Number\(l\.id\)\)/);
  assert.match(app, /localStorage\.setItem\(KEY, JSON\.stringify\(data\)\)/);
  assert.match(app, /Data could not be saved/);
});


test('backup import enforces a size cap and rolls back when browser storage cannot save', () => {
  assert.match(app, /file\.size>2\*1024\*1024/);
  assert.match(app, /const previousData=data/);
  assert.match(app, /if\(!save\(\)\)\{data=previousData;return;\}/);
  assert.match(app, /Backup file exceeds 2 MB limit/);
});


test('database enforces bounded lead/content inputs independently of browser validation', () => {
  assert.match(normalized, /char_length\(company\) <= 160/);
  assert.match(normalized, /char_length\(service\) <= 120/);
  assert.match(normalized, /char_length\(phone\) <= 40/);
  assert.match(normalized, /char_length\(email\) <= 254/);
  assert.match(normalized, /char_length\(notes\) <= 4000/);
  assert.match(normalized, /platform in \('facebook','instagram','tiktok','linkedin','youtube'\)/);
  assert.match(normalized, /char_length\(body\) <= 10000/);
});

test('invitation reservation rechecks actor authority under the workspace membership lock', () => {
  const reservation = sql.slice(sql.indexOf('create or replace function public.reserve_workspace_invitation'), sql.indexOf('revoke all on function public.reserve_workspace_invitation'));
  assert.match(reservation, /pg_advisory_xact_lock\(hashtextextended\(target_workspace::text, 0\)\)/);
  assert.match(reservation, /from public\.workspace_members[\s\S]*?for update/);
  assert.match(reservation, /actor_role not in \('owner','admin'\)/);
});

test('role changes and audit insertion are atomic and restricted to the service role', () => {
  const roleFunction = sql.slice(sql.indexOf('create or replace function public.set_workspace_member_role'), sql.indexOf('revoke all on function public.set_workspace_member_role'));
  assert.match(roleFunction, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/);
  assert.match(roleFunction, /pg_advisory_xact_lock\(hashtextextended\(target_workspace::text, 0\)\)/);
  assert.match(roleFunction, /actor_role not in \('owner','admin'\)/);
  assert.match(roleFunction, /actor_role = 'admin'[\s\S]*?target_role = 'admin'/);
  assert.match(roleFunction, /update public\.workspace_members[\s\S]*?insert into public\.audit_events/);
  assert.match(normalized, /grant execute on function public\.set_workspace_member_role\(uuid, uuid, uuid, text\) to service_role/);
  assert.match(teamFunction, /admin\.rpc\('set_workspace_member_role'/);
  assert.doesNotMatch(teamFunction, /from\('workspace_members'\)[\s\S]*?\.update\(\{ role \}\)/);
});


test('invitation membership and audit writes are atomic and re-authorized after Auth invite', () => {
  const invitationFunction = sql.slice(sql.indexOf('create or replace function public.add_workspace_member_invitation'), sql.indexOf('revoke all on function public.add_workspace_member_invitation'));
  assert.match(invitationFunction, /coalesce\(auth\.role\(\), ''\) <> 'service_role'/);
  assert.match(invitationFunction, /pg_advisory_xact_lock\(hashtextextended\(target_workspace::text, 0\)\)/);
  assert.match(invitationFunction, /actor_role not in \('owner','admin'\)/);
  assert.match(invitationFunction, /actor_role = 'admin' and target_role = 'admin'/);
  assert.match(invitationFunction, /insert into public\.workspace_members[\s\S]*?insert into public\.audit_events/);
  assert.match(normalized, /grant execute on function public\.add_workspace_member_invitation\(uuid, uuid, uuid, text\) to service_role/);
  assert.match(teamFunction, /admin\.rpc\('add_workspace_member_invitation'/);
  assert.match(teamFunction, /deleteUser\(invited\.user\.id\)/);
  assert.doesNotMatch(teamFunction, /from\('workspace_members'\)\.insert/);
});

test('local demo restores persisted state after failed saves and bounds record inputs', () => {
  assert.match(app, /data = load\(\);[\s\S]*?previously saved data has been restored/);
  assert.match(app, /l\.name\.length <= 160/);
  assert.match(app, /l\.notes\.length <= 4000/);
  assert.match(app, /c\.title\.length <= 200/);
  assert.match(app, /Number\.isFinite\(value\)\|\|value<0/);
});

test('AI quota lockdown migration is safe on a clean database before the quota RPC migration', async () => {
  const lockdown = await readFile(new URL('../supabase/migrations/20261120195748_ai_content_usage_rls_lockdown.sql', import.meta.url), 'utf8');
  const quota = await readFile(new URL('../supabase/migrations/20261121000000_ai_content_usage_quota.sql', import.meta.url), 'utf8');
  assert.match(lockdown.toLowerCase(), /create table if not exists private\.ai_content_usage/);
  assert.match(lockdown.toLowerCase(), /grant usage on schema private to service_role/);
  assert.match(lockdown.toLowerCase(), /revoke all on table private\.ai_content_usage from public, anon, authenticated/);
  assert.match(quota.toLowerCase(), /create table if not exists private\.ai_content_usage/);
  assert.match(quota.toLowerCase(), /create or replace function public\.reserve_ai_content_generation/);
});




test('AI quota reservations have exact, server-only release semantics on provider failure', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20261127180000_ai_content_quota_release.sql', import.meta.url), 'utf8');
  const edge = await readFile(new URL('../supabase/functions/ai-content/index.ts', import.meta.url), 'utf8');
  const normalizedMigration = migration.replace(/--.*$/gm, '').replace(/\s+/g, ' ').toLowerCase();
  assert.match(normalizedMigration, /create or replace function public\.reserve_ai_content_generation_v2\(target_actor uuid\)[\s\S]*?returns text/);
  assert.match(normalizedMigration, /insert into private\.ai_content_usage\(user_id\) values \(target_actor\) returning id into reservation_id/);
  assert.match(normalizedMigration, /create or replace function public\.release_ai_content_generation_reservation\(\s*target_reservation bigint, target_actor uuid\s*\)/);
  assert.match(normalizedMigration, /where id = target_reservation and user_id = target_actor/);
  assert.match(normalizedMigration, /revoke all on function public\.release_ai_content_generation_reservation\(bigint, uuid\) from public, anon, authenticated/);
  assert.match(normalizedMigration, /grant execute on function public\.release_ai_content_generation_reservation\(bigint, uuid\) to service_role/);
  assert.match(edge, /reserve_ai_content_generation_v2/);
  assert.ok(edge.includes('!/^\\d+$/.test(reservationId)'), 'reservation identifier must be validated as decimal digits');
  assert.match(edge, /release_ai_content_generation_reservation/);
  assert.match(edge, /await releaseQuotaReservation\(\);[\s\S]*?AI provider request failed/);
  assert.match(edge, /A successful provider response may still incur usage/);
  assert.match(edge, /A timeout\/network failure is ambiguous/);
  assert.doesNotMatch(edge, /catch \(error\) \{\s+await releaseQuotaReservation/);
  assert.match(edge, /Deno\.env\.get\(["']SUPABASE_SERVICE_ROLE_KEY["']\)/);
});


test('Windows desktop package uses the BK-BusiCare branded icon generator', async () => {
  const config = await readFile(new URL('../electron-builder.yml', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/windows-desktop.yml', import.meta.url), 'utf8');
  const generator = await readFile(new URL('../scripts/generate-windows-icon.mjs', import.meta.url), 'utf8');
  assert.match(config, /icon: assets\/busicare-app-icon\.ico/);
  assert.match(workflow, /npm install --no-save --package-lock=false electron electron-builder sharp png-to-ico/);
  assert.match(workflow, /node scripts\/generate-windows-icon\.mjs/);
  assert.match(generator, /public\/busicare-app-icon\.svg/);
  assert.match(generator, /busicare-app-icon\.ico/);
});
