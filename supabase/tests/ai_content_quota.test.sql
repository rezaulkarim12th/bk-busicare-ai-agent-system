begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
insert into auth.users (id, aud, role, email, encrypted_password)
values ('30000000-0000-4000-8000-000000000001','authenticated','authenticated','ai-quota-test@example.invalid','')
on conflict (id) do nothing;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"30000000-0000-4000-8000-000000000001"}',true);
select throws_ok(
  $$select public.reserve_ai_content_generation('30000000-0000-4000-8000-000000000001')$$,
  'P0001', null, 'authenticated users cannot call the server-only quota RPC'
);
reset role;
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role","sub":"00000000-0000-0000-0000-000000000000"}',true);
select is(public.reserve_ai_content_generation('30000000-0000-4000-8000-000000000001'), true,
  'service role can reserve a generation');
select is((select count(*)::integer from private.ai_content_usage
  where user_id='30000000-0000-4000-8000-000000000001'),1,
  'successful reservation records one usage event');
select * from finish();
rollback;
