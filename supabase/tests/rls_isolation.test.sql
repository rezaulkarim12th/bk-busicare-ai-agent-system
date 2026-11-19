-- Disposable local-database RLS regression tests.
-- Run with: supabase test db
begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

-- Seed isolated identities and two tenants as the database owner.
insert into auth.users (id, aud, role, email, encrypted_password)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-owner-a@example.invalid', ''),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-viewer-a@example.invalid', ''),
  ('20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-member-b@example.invalid', '')
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
  ('bbbbbbbb-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'member')
on conflict (workspace_id, user_id) do nothing;

insert into public.leads (id, workspace_id, name, created_by)
values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tenant A lead', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-1111-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Tenant B lead', '20000000-0000-4000-8000-000000000001');

insert into public.content_items (id, workspace_id, title, platform, created_by)
values
  ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Tenant A content', 'Facebook', '10000000-0000-4000-8000-000000000001'),
  ('bbbbbbbb-2222-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'Tenant B content', 'Instagram', '20000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is((select count(*)::integer from public.leads), 1,
  'viewer reads only the lead in their workspace');
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

select * from finish();
rollback;
