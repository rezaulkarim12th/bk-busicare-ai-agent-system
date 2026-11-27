begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, aud, role, email, encrypted_password)
values
  ('30000000-0000-4000-8000-000000000011','authenticated','authenticated','ai-quota-release@example.invalid',''),
  ('30000000-0000-4000-8000-000000000012','authenticated','authenticated','ai-quota-other@example.invalid','')
on conflict (id) do nothing;

create temporary table ai_quota_test_reservation (id text);
grant all on table ai_quota_test_reservation to service_role;

set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","sub":"30000000-0000-4000-8000-000000000011"}',true);
select throws_ok(
  $$select public.reserve_ai_content_generation_v2('30000000-0000-4000-8000-000000000011')$$,
  '42501', null, 'authenticated users cannot reserve AI quota'
);
select throws_ok(
  $$select public.release_ai_content_generation_reservation(1,'30000000-0000-4000-8000-000000000011')$$,
  '42501', null, 'authenticated users cannot release AI quota'
);

reset role;
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role","sub":"00000000-0000-0000-0000-000000000000"}',true);
insert into ai_quota_test_reservation(id)
select public.reserve_ai_content_generation_v2('30000000-0000-4000-8000-000000000011');
select matches((select id from ai_quota_test_reservation), '^[0-9]+$',
  'reservation returns an exact numeric identifier');
select is((select count(*)::integer from private.ai_content_usage
  where user_id='30000000-0000-4000-8000-000000000011'),1,
  'reservation creates one usage event');
select is(public.release_ai_content_generation_reservation(
  (select id::bigint from ai_quota_test_reservation),'30000000-0000-4000-8000-000000000012'),false,
  'a different user cannot release another user reservation');
select is((select count(*)::integer from private.ai_content_usage
  where user_id='30000000-0000-4000-8000-000000000011'),1,
  'wrong-user release leaves the reservation intact');
select is(public.release_ai_content_generation_reservation(
  (select id::bigint from ai_quota_test_reservation),'30000000-0000-4000-8000-000000000011'),true,
  'the owning user reservation can be released by the server');
select is((select count(*)::integer from private.ai_content_usage
  where user_id='30000000-0000-4000-8000-000000000011'),0,
  'released reservation no longer consumes quota');
select is(public.release_ai_content_generation_reservation(
  (select id::bigint from ai_quota_test_reservation),'30000000-0000-4000-8000-000000000011'),false,
  'releasing the same reservation twice is harmless');

select * from finish();
rollback;
