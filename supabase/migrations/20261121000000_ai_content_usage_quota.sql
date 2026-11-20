-- Server-only, atomic per-user AI generation quotas.
create table if not exists private.ai_content_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant usage on schema private to service_role;
create index if not exists ai_content_usage_user_created_idx
  on private.ai_content_usage(user_id, created_at desc);
revoke all on table private.ai_content_usage from public, anon, authenticated;
grant select, insert, delete on table private.ai_content_usage to service_role;

create or replace function public.reserve_ai_content_generation(target_actor uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  minute_count integer;
  daily_count integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if target_actor is null then
    raise exception 'Authenticated user required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_actor::text, 0));
  delete from private.ai_content_usage where created_at < now() - interval '24 hours';
  select count(*)::integer into minute_count from private.ai_content_usage
    where user_id = target_actor and created_at >= now() - interval '1 minute';
  select count(*)::integer into daily_count from private.ai_content_usage
    where user_id = target_actor and created_at >= now() - interval '24 hours';
  if minute_count >= 5 or daily_count >= 50 then return false; end if;
  insert into private.ai_content_usage(user_id) values (target_actor);
  return true;
end;
$$;
revoke all on function public.reserve_ai_content_generation(uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_content_generation(uuid) to service_role;
