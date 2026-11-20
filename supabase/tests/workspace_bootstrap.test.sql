-- First-workspace bootstrap RPC authorization and idempotency tests.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users(id,aud,role,email,encrypted_password)
values ('40000000-0000-4000-8000-000000000001','authenticated','authenticated','workspace-bootstrap@example.invalid','')
on conflict(id) do nothing;

set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role","sub":"00000000-0000-0000-0000-000000000000"}',true);
create temp table bootstrap_result(workspace_id uuid);
insert into bootstrap_result
select public.create_workspace_for_user(
  'BK-BusiCare bootstrap test',
  '40000000-0000-4000-8000-000000000001'
);
select ok(
  (select wm.role='owner'
   from public.workspace_members wm
   join bootstrap_result b on b.workspace_id=wm.workspace_id
   where wm.user_id='40000000-0000-4000-8000-000000000001'),
  'first workspace assigns owner membership'
);
select throws_ok(
  $$select public.create_workspace_for_user('Second workspace','40000000-0000-4000-8000-000000000001')$$,
  'P0001','User already belongs to a workspace',
  'duplicate first workspace is rejected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"40000000-0000-4000-8000-000000000001"}',true);
select throws_ok(
  $$select public.create_workspace_for_user('Unauthorized workspace','40000000-0000-4000-8000-000000000001')$$,
  '42501',null,
  'authenticated client cannot directly call privileged RPC'
);

select * from finish();
rollback;
