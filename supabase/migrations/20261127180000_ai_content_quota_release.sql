-- Track quota reservations by an exact identifier so failed provider calls can safely release only their own reservation.
-- Keep the legacy RPC for compatibility; the Edge Function switches to the v2 reservation contract.
create or replace function public.reserve_ai_content_generation_v2(target_actor uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  minute_count integer;
  daily_count integer;
  reservation_id bigint;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if target_actor is null then
    raise exception 'Authenticated user required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_actor::text, 0));
  delete from private.ai_content_usage where created_at < now() - interval '24 hours';
  select count(*)::integer into minute_count from private.ai_content_usage
    where user_id = target_actor and created_at >= now() - interval '1 minute';
  select count(*)::integer into daily_count from private.ai_content_usage
    where user_id = target_actor and created_at >= now() - interval '24 hours';
  if minute_count >= 5 or daily_count >= 50 then return null; end if;
  insert into private.ai_content_usage(user_id) values (target_actor)
    returning id into reservation_id;
  return reservation_id::text;
end;
$$;

create or replace function public.release_ai_content_generation_reservation(
  target_reservation bigint,
  target_actor uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  released_count integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if target_reservation is null or target_actor is null then
    raise exception 'Reservation and authenticated user are required';
  end if;
  delete from private.ai_content_usage
    where id = target_reservation and user_id = target_actor;
  get diagnostics released_count = row_count;
  return released_count = 1;
end;
$$;

revoke all on function public.reserve_ai_content_generation_v2(uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_content_generation_v2(uuid) to service_role;
revoke all on function public.release_ai_content_generation_reservation(bigint, uuid) from public, anon, authenticated;
grant execute on function public.release_ai_content_generation_reservation(bigint, uuid) to service_role;
