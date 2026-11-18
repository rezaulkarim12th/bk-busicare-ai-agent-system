import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/migrations/0001_multitenant_foundation.sql', import.meta.url), 'utf8');
const normalized = sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').toLowerCase();

test('creates all workspace-scoped operational tables', () => {
  for (const table of ['workspaces','workspace_members','leads','content_items','audit_events']) {
    assert.match(normalized, new RegExp('create table if not exists public\\.' + table + '\\b'));
  }
});

test('enables row-level security on every tenant data table', () => {
  for (const table of ['workspaces','workspace_members','leads','content_items','audit_events']) {
    assert.match(normalized, new RegExp('alter table public\\.' + table + ' enable row level security'));
  }
});

test('workspace creation requires an authenticated user and assigns owner role', () => {
  assert.match(normalized, /create or replace function public\.create_workspace\(workspace_name text\)/);
  assert.match(normalized, /if caller_id is null then raise exception 'authentication required'/);
  assert.match(normalized, /values \(new_workspace_id, caller_id, 'owner'\)/);
  assert.match(normalized, /grant execute on function public\.create_workspace\(text\) to authenticated/);
});

test('lead and content policies scope access to workspace membership', () => {
  assert.match(normalized, /create policy "members can view leads" on public\.leads for select to authenticated using \(public\.is_workspace_member\(workspace_id\)\)/);
  assert.match(normalized, /create policy "members can view content" on public\.content_items for select to authenticated using \(public\.is_workspace_member\(workspace_id\)\)/);
  assert.match(normalized, /public\.has_workspace_role\(workspace_id, array\['owner','admin','member'\]\)/);
});

test('browser clients cannot directly mutate workspace membership', () => {
  assert.doesNotMatch(normalized, /create policy[^;]*on public\.workspace_members for (insert|update|delete)/);
  assert.match(sql.toLowerCase(), /no client-side policies for membership writes/);
});
