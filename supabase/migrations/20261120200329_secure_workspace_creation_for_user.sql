-- Server-only first-workspace creation endpoint.
-- The Edge Function validates the caller JWT and passes its verified user ID.
create or replace function public.create_workspace_for_user(
  workspace_name text,
  target_user uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  new_workspace_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  if target_user is null then
    raise exception 'Target user is required';
  end if;

  if workspace_name is null
     or char_length(trim(workspace_name)) not between 2 and 120 then
    raise exception 'Workspace name must contain 2 to 120 characters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(target_user::text, 0)
  );

  if exists (
    select 1 from public.workspace_members wm
    where wm.user_id = target_user
  ) then
    raise exception 'User already belongs to a workspace';
  end if;

  insert into public.workspaces(name)
  values (trim(workspace_name))
  returning id into new_workspace_id;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace_id, target_user, 'owner');

  return new_workspace_id;
end;
$function$;

revoke all on function public.create_workspace_for_user(text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_workspace_for_user(text, uuid)
  to service_role;
