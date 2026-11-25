import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationFiles = [
  '20261120044848_multitenant_foundation.sql',
  '20261120044911_performance_hardening.sql',
  '20261120105527_production_team_management_rpcs.sql'
];
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
  assert.match(normalized, /revoke all on table public\\.workspaces, public\\.workspace_members, public\\.leads, public\\.content_items, public\\.audit_events from public, anon, authenticated/);
  assert.match(normalized, /grant select on table public\\.workspaces to authenticated/);
  assert.match(normalized, /grant update \\(name\\) on table public\\.workspaces to authenticated/);
  assert.match(normalized, /grant select on table public\\.workspace_members to authenticated/);
  assert.match(normalized, /grant select on table public\\.audit_events to authenticated/);
});

test('authorization helpers are private, non-API functions with a locked search path', () => {
  assert.match(normalized, /create schema if not exists private/);
  assert.match(normalized, /create or replace function private\\.is_workspace_member\\(target_workspace uuid\\)[\\s\\S]*?set search_path = ''/);
  assert.match(normalized, /create or replace function private\\.has_workspace_role\\(target_workspace uuid, allowed_roles text\\[\\]\\)[\\s\\S]*?set search_path = ''/);
  assert.match(normalized, /create or replace function public\\.reserve_workspace_invitation\\(target_workspace uuid, target_actor uuid\\)/);
  assert.match(normalized, /revoke all on schema private from public, anon, authenticated/);
  assert.match(normalized, /grant usage on schema private to authenticated/);
  assert.match(normalized, /grant execute on function private\\.is_workspace_member\\(uuid\\) to authenticated/);
});

test('team RPCs are service-role only and rate limited', () => {
  assert.match(normalized, /revoke all on function public\\.reserve_workspace_invitation\\(uuid, uuid\\) from public, anon, authenticated/);
  assert.match(normalized, /grant execute on function public\\.reserve_workspace_invitation\\(uuid, uuid\\) to service_role/);
  const emailValidation = teamFunction.indexOf('A valid email address is required');
  const rateReservation = teamFunction.indexOf("admin.rpc('reserve_workspace_invitation'");
  assert.ok(emailValidation >= 0 && rateReservation > emailValidation, 'Invalid email input must not consume an invitation rate-limit reservation');
});

test('invitation quota SQL function uses a valid dollar-quoted body', () => {
  const functionSql = sql.slice(sql.indexOf('create or replace function public.reserve_workspace_invitation'), sql.indexOf('revoke all on function public.reserve_workspace_invitation'));
  assert.ok(functionSql.includes("as " + String.fromCharCode(36, 36) + String.fromCharCode(10) + "declare"));
  assert.ok(functionSql.includes("end;" + String.fromCharCode(10) + String.fromCharCode(36, 36) + ";"));
});

test('team invitation email validation rejects whitespace', () => {
  assert.ok(teamFunction.includes("/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)"));
});

test('signup and password recovery enforce a 12-character minimum in the client', () => {
  assert.match(portal, /mode === 'signup' && password\\.length < 12/);
  assert.match(portal, /password\\.length < 12/);
});

test('all SECURITY DEFINER functions pin an empty search_path', () => {
  const definitions = [...normalized.matchAll(/create or replace function ([a-z0-9_.]+)\\([^)]*\\)[\\s\\S]*?\\$\\$/g)];
  assert.ok(definitions.length > 0);
  for (const definition of definitions) {
    assert.ok(definition[0].includes("set search_path = ''"), definition[1] + ' must pin search_path');
  }
});
