-- Additive production upgrade for the existing BK-BusiCare schema.
-- Team administration is callable only through the trusted Edge Function service role.
-- Authorization uses the signed JWT role claim; search_path is pinned to prevent object shadowing.

create or replace function public.reserve_workspace_invitation(
  target_workspace uuid,
  target_actor uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_attempts integer;
  actor_role text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_workspace::text, 0));
  select role into actor_role
  from public.workspace_members
  where workspace_id = target_workspace and user_id = target_actor
  for update;

  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'Workspace owner/admin permission required';
  end if;

  select count(*)::integer into recent_attempts
  from public.audit_events
  where workspace_id = target_workspace
    and actor_id = target_actor
    and action = 'member.invitation_attempted'
    and created_at >= now() - interval '10 minutes';

  if recent_attempts >= 5 then
    return false;
  end if;

  insert into public.audit_events(workspace_id, actor_id, action, entity_type, metadata)
  values (target_workspace, target_actor, 'member.invitation_attempted', 'workspace_member', '{}'::jsonb);

  return true;
end;
$$;

revoke all on function public.reserve_workspace_invitation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_workspace_invitation(uuid, uuid) to service_role;

create or replace function public.set_workspace_member_role(
  target_workspace uuid,
  target_actor uuid,
  target_user uuid,
  target_role text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
  previous_role text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if target_actor = target_user or target_role not in ('admin','member','viewer') then
    raise exception 'Invalid role change request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_workspace::text, 0));
  select role into actor_role from public.workspace_members
  where workspace_id = target_workspace and user_id = target_actor for update;
  select role into previous_role from public.workspace_members
  where workspace_id = target_workspace and user_id = target_user for update;

  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'Workspace owner/admin permission required';
  end if;
  if previous_role is null or previous_role = 'owner' then
    raise exception 'Target is not an editable workspace member';
  end if;
  if actor_role = 'admin' and (previous_role = 'admin' or target_role = 'admin') then
    raise exception 'Only the workspace owner may manage admin roles';
  end if;

  update public.workspace_members
  set role = target_role
  where workspace_id = target_workspace and user_id = target_user;

  insert into public.audit_events(workspace_id, actor_id, action, entity_type, entity_id, metadata)
  values (target_workspace, target_actor, 'member.role_changed', 'workspace_member', target_user::text,
    jsonb_build_object('from', previous_role, 'to', target_role));

  return true;
end;
$$;

revoke all on function public.set_workspace_member_role(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.set_workspace_member_role(uuid, uuid, uuid, text) to service_role;

create or replace function public.add_workspace_member_invitation(
  target_workspace uuid,
  target_actor uuid,
  target_user uuid,
  target_role text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Service role required';
  end if;
  if target_role not in ('admin','member','viewer') then
    raise exception 'Invalid invitation role';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_workspace::text, 0));
  select role into actor_role from public.workspace_members
  where workspace_id = target_workspace and user_id = target_actor for update;

  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'Workspace owner/admin permission required';
  end if;
  if actor_role = 'admin' and target_role = 'admin' then
    raise exception 'Only the workspace owner may invite admins';
  end if;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (target_workspace, target_user, target_role);

  insert into public.audit_events(workspace_id, actor_id, action, entity_type, entity_id, metadata)
  values (target_workspace, target_actor, 'member.invited', 'workspace_member', target_user::text,
    jsonb_build_object('role', target_role));

  return true;
end;
$$;

revoke all on function public.add_workspace_member_invitation(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.add_workspace_member_invitation(uuid, uuid, uuid, text) to service_role;
