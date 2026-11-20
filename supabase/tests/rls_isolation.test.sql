-- Disposable local-database RLS regression tests.
-- Run with: supabase test db
begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

-- Seed isolated identities and two tenants as the database owner.
insert into auth.users (id, aud, role, email, encrypted_password)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-owner-a@example.invalid', ''),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-viewer-a@example.invalid', ''),
  ('20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-member-b@example.invalid', ''),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'rls-admin-a@example.invalid', ''),
  ('10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'rls-member-a@example.invalid', '')
on conflict (id) do nothing;

insert into public.workspaces (id, name)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'RLS Tenant A'),
  ('bbbbbbbb-0000-4000-8000-000000000001', 'RLS Tenant B')
on conflict (id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'viewer'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'member'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'admin'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'member')
on conflict (workspace_id, user_id) do nothing;

insert into public.leads (id, workspace_id, name, created_by)
values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tenant A lead', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-1111-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Tenant B lead', '20000000-0000-4000-8000-000000000001'),
  ('aaaaaaaa-1111-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Admin delete test lead', '10000000-0000-4000-8000-000000000001');

insert into public.audit_events (workspace_id, actor_id, action, entity_type)
values ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'test.seeded', 'security_test');

insert into public.content_items (id, workspace_id, title, platform, created_by)
values
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tenant A content', 'Facebook', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-2222-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Tenant B content', 'Instagram', '20000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*)::integer from public.leads), 2,
  'viewer reads only leads in their workspace');
select is((select count(*)::integer from public.leads where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000001'), 0,
  'viewer cannot read another workspace');
select throws_ok(
  $$insert into public.leads (workspace_id, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'viewer must not create')$$,
  '42501', null, 'viewer cannot create leads'
);

-- RLS filters unauthorized UPDATE/DELETE rows rather than raising an error.
update public.leads set name = 'viewer changed this'
where id = 'aaaaaaaa-1111-4000-8000-000000000001';
select is((select name from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  'Tenant A lead', 'viewer cannot update leads');

delete from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000001';
select is((select count(*)::integer from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  1, 'viewer cannot delete leads');

select is((select count(*)::integer from public.content_items), 1,
  'viewer reads only content in their workspace');
select is((select count(*)::integer from public.content_items where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000001'), 0,
  'viewer cannot read another workspace content');
select throws_ok(
  $$insert into public.content_items (workspace_id, title, platform) values ('aaaaaaaa-0000-4000-8000-000000000001', 'viewer must not create', 'Facebook')$$,
  '42501', null, 'viewer cannot create content'
);
update public.content_items set title = 'viewer changed this'
where id = 'aaaaaaaa-2222-4000-8000-000000000001';
select is((select title from public.content_items where id = 'aaaaaaaa-2222-4000-8000-000000000001'),
  'Tenant A content', 'viewer cannot update content');
delete from public.content_items where id = 'aaaaaaaa-2222-4000-8000-000000000001';
select is((select count(*)::integer from public.content_items where id = 'aaaaaaaa-2222-4000-8000-000000000001'),
  1, 'viewer cannot delete content');

select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.leads), 1,
  'member reads only the lead in their own workspace');
delete from public.leads where id = 'bbbbbbbb-1111-4000-8000-000000000001';
select is((select count(*)::integer from public.leads where id = 'bbbbbbbb-1111-4000-8000-000000000001'), 1,
  'member cannot delete leads');

insert into public.leads (workspace_id, name)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'Member-created lead');
select is((select count(*)::integer from public.leads
  where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000001'
    and created_by = '20000000-0000-4000-8000-000000000001'), 2,
  'member can create a lead attributed to their authenticated identity');
select is((select count(*)::integer from public.content_items), 1,
  'member reads only content in their own workspace');
delete from public.content_items where id = 'bbbbbbbb-2222-4000-8000-000000000001';
select is((select count(*)::integer from public.content_items where id = 'bbbbbbbb-2222-4000-8000-000000000001'), 1,
  'member cannot delete content');
insert into public.content_items (workspace_id, title, platform)
values ('bbbbbbbb-0000-4000-8000-000000000001', 'Member-created content', 'LinkedIn');
select is((select count(*)::integer from public.content_items
  where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000001'
    and created_by = '20000000-0000-4000-8000-000000000001'), 2,
  'member can create content attributed to their authenticated identity');

-- Verify immutable tenant/creator identity and privileged-table write boundaries.
select throws_ok(
  $$update public.leads set workspace_id = 'aaaaaaaa-0000-4000-8000-000000000001'
    where id = 'bbbbbbbb-1111-4000-8000-000000000001'$$,
  'P0001', null, 'member cannot move a lead to another workspace'
);
select throws_ok(
  $$update public.leads set created_by = '10000000-0000-4000-8000-000000000001'
    where id = 'bbbbbbbb-1111-4000-8000-000000000001'$$,
  'P0001', null, 'member cannot rewrite lead creator identity'
);
select throws_ok(
  $$update public.content_items set workspace_id = 'aaaaaaaa-0000-4000-8000-000000000001'
    where id = 'bbbbbbbb-2222-4000-8000-000000000001'$$,
  'P0001', null, 'member cannot move content to another workspace'
);
select throws_ok(
  $$update public.content_items set created_by = '10000000-0000-4000-8000-000000000001'
    where id = 'bbbbbbbb-2222-4000-8000-000000000001'$$,
  'P0001', null, 'member cannot rewrite content creator identity'
);
select throws_ok(
  $$update public.workspace_members set role = 'owner'
    where workspace_id = 'bbbbbbbb-0000-4000-8000-000000000001'
      and user_id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'member cannot self-promote through membership table'
);
select throws_ok(
  $$update public.audit_events set action = 'forged.update'
    where workspace_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '42501', null, 'member cannot rewrite audit events'
);
select throws_ok(
  $$delete from public.audit_events
    where workspace_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '42501', null, 'member cannot delete audit events'
);

-- Owner/admin authorization and audit-log isolation.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.audit_events), 1,
  'workspace owner can read audit events');
update public.workspaces set name = 'RLS Tenant A Owner Updated'
where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select name from public.workspaces where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'RLS Tenant A Owner Updated', 'workspace owner can update workspace settings');
delete from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000001';
select is((select count(*)::integer from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  0, 'workspace owner can delete leads');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.audit_events), 1,
  'workspace admin can read audit events');
update public.workspaces set name = 'RLS Tenant A Admin Updated'
where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is((select name from public.workspaces where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'RLS Tenant A Admin Updated', 'workspace admin can update workspace settings');
delete from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000002';
select is((select count(*)::integer from public.leads where id = 'aaaaaaaa-1111-4000-8000-000000000002'),
  0, 'workspace admin can delete leads');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.audit_events), 0,
  'workspace member cannot read audit events');
select throws_ok(
  $$insert into public.audit_events (workspace_id, action, entity_type)
    values ('aaaaaaaa-0000-4000-8000-000000000001', 'forged.event', 'security_test')$$,
  '42501', null, 'workspace member cannot forge audit events');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.audit_events), 0,
  'workspace viewer cannot read audit events');

select * from finish();
rollback;
