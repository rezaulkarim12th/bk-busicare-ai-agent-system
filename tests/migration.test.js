import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/migrations/0001_multitenant_foundation.sql', import.meta.url), 'utf8');
const normalized = sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').toLowerCase();
const portal = await readFile(new URL('../src/auth-portal.js', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

test('creates all workspace-scoped operational tables with RLS enabled', () => {
  for (const table of ['workspaces','workspace_members','leads','content_items','audit_events']) {
    assert.match(normalized, new RegExp('create table if not exists public\\.' + table + '\\b'));
    assert.match(normalized, new RegExp('alter table public\\.' + table + ' enable row level security'));
  }
});

test('authorization helpers are private, non-API functions with a locked search path', () => {
  assert.match(normalized, /create schema if not exists private/);
  assert.match(normalized, /create or replace function private\.is_workspace_member\(target_workspace uuid\)[\s\S]*?set search_path = ''/);
  assert.match(normalized, /create or replace function private\.has_workspace_role\(target_workspace uuid, allowed_roles text\[\]\)[\s\S]*?set search_path = ''/);
  assert.doesNotMatch(normalized, /create or replace function public\.(is_workspace_member|has_workspace_role)/);
  assert.match(normalized, /revoke all on schema private from public, anon, authenticated/);\n  assert.match(normalized, /grant usage on schema private to authenticated/);
  assert.match(normalized, /grant execute on function private\.is_workspace_member\(uuid\) to authenticated/);
});

test('workspace creation requires authentication and atomically assigns owner role', () => {
  assert.match(normalized, /create or replace function public\.create_workspace\(workspace_name text\)/);
  assert.match(normalized, /if caller_id is null then raise exception 'authentication required'/);
  assert.match(normalized, /values \(new_workspace_id, caller_id, 'owner'\)/);
  assert.match(normalized, /revoke all on function public\.create_workspace\(text\) from public, anon/);
  assert.match(normalized, /grant execute on function public\.create_workspace\(text\) to authenticated/);
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

test('authenticated or partially configured mode never renders the local demo', () => {
  assert.match(app, /const hasSupabaseUrl=Boolean\(import\.meta\.env\.VITE_SUPABASE_URL\?\.trim\(\)\)/);
  assert.match(app, /const hasSupabaseKey=Boolean\(import\.meta\.env\.VITE_SUPABASE_ANON_KEY\?\.trim\(\)\)/);
  assert.match(app, /if \(!hasSupabaseUrl && !hasSupabaseKey\) render\(\)/);
});

test('backup import validates records and CSV export mitigates formula injection', () => {
  assert.match(app, /Number\.isSafeInteger\(Number\(l\.id\)\)/);
  assert.match(app, /contentOk=Array\.isArray\(incoming\?\.content\)/);
  assert.match(app, /function csvCell\(value\)/);
  assert.match(app, /\[=\+@-\]/);
  assert.match(app, /data-edit-lead="\$\{esc\(l\.id\)\}"/);
});
