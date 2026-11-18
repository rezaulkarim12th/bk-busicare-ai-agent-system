-- BK-BusiCare multi-tenant foundation (Supabase PostgreSQL)
-- Apply only to a new disposable Supabase project after reviewing this migration.
-- Do not apply to a production database without a reviewed migration plan.

create extension if not exists pgcrypto;

-- Keep authorization helpers outside the PostgREST-exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  company text not null default '',
  service text not null default '',
  phone text not null default '',
  email text not null default '',
  status text not null default 'New' check (status in ('New','Contacted','Proposal','Won','Lost')),
  value numeric(14,2) not null default 0 check (value >= 0),
  follow_up date,
  notes text not null default '',
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  platform text not null,
  body text not null default '',
  scheduled_at timestamptz,
  status text not null default 'Draft' check (status in ('Draft','Needs approval','Approved','Scheduled','Published','Failed')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null default auth.uid() references auth.users(id),
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists leads_workspace_status_idx on public.leads(workspace_id, status);
create index if not exists leads_workspace_follow_up_idx on public.leads(workspace_id, follow_up);
create index if not exists content_workspace_schedule_idx on public.content_items(workspace_id, scheduled_at);
create index if not exists audit_workspace_created_idx on public.audit_events(workspace_id, created_at desc);

-- Atomically reserve invitation attempts so concurrent requests cannot bypass
-- the per-actor limit. Only the trusted Edge Function service role may call this.
create or replace function public.reserve_workspace_invitation(target_workspace uuid, target_actor uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_attempts integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_workspace::text || ':' || target_actor::text, 0));

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


-- Explicit table privileges complement RLS; anonymous clients receive no table access.
revoke all on table
  public.workspaces,
  public.workspace_members,
  public.leads,
  public.content_items,
  public.audit_events
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on table public.workspaces to authenticated;
grant update (name) on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.content_items to authenticated;
grant select on table public.audit_events to authenticated;

-- SECURITY DEFINER helpers live in a non-API-exposed schema.
create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = auth.uid()
  );
$$;

create or replace function private.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public, anon, authenticated;
revoke all on function private.has_workspace_role(uuid, text[]) from public, anon, authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, text[]) to authenticated;

-- Prevent tenant identity fields being rewritten through ordinary record updates.
create or replace function private.guard_tenant_record_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workspace_id is distinct from old.workspace_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Workspace and creator identity fields are immutable';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.guard_tenant_record_identity() from public, anon, authenticated;

drop trigger if exists leads_guard_identity on public.leads;
create trigger leads_guard_identity
before update on public.leads
for each row execute function private.guard_tenant_record_identity();

drop trigger if exists content_guard_identity on public.content_items;
create trigger content_guard_identity
before update on public.content_items
for each row execute function private.guard_tenant_record_identity();

-- Atomic workspace creation: authenticated caller becomes its owner.
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if workspace_name is null or char_length(trim(workspace_name)) not between 2 and 120 then
    raise exception 'Workspace name must contain 2 to 120 characters';
  end if;

  insert into public.workspaces(name)
  values (trim(workspace_name))
  returning id into new_workspace_id;

  insert into public.workspace_members(workspace_id, user_id, role)
  values (new_workspace_id, caller_id, 'owner');

  return new_workspace_id;
end;
$$;

revoke all on function public.create_workspace(text) from public, anon, authenticated;
grant execute on function public.create_workspace(text) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.content_items enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "workspace members can view workspaces" on public.workspaces;
create policy "workspace members can view workspaces"
on public.workspaces for select to authenticated
using (private.is_workspace_member(id));

drop policy if exists "workspace admins can update workspaces" on public.workspaces;
create policy "workspace admins can update workspaces"
on public.workspaces for update to authenticated
using (private.has_workspace_role(id, array['owner','admin']))
with check (private.has_workspace_role(id, array['owner','admin']));

drop policy if exists "members can view workspace membership" on public.workspace_members;
create policy "members can view workspace membership"
on public.workspace_members for select to authenticated
using (
  user_id = auth.uid()
  or private.has_workspace_role(workspace_id, array['owner','admin'])
);

drop policy if exists "members can view leads" on public.leads;
create policy "members can view leads"
on public.leads for select to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists "contributors can create leads" on public.leads;
create policy "contributors can create leads"
on public.leads for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = auth.uid()
);

drop policy if exists "contributors can update leads" on public.leads;
create policy "contributors can update leads"
on public.leads for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']));

drop policy if exists "admins can delete leads" on public.leads;
create policy "admins can delete leads"
on public.leads for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']));

drop policy if exists "members can view content" on public.content_items;
create policy "members can view content"
on public.content_items for select to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists "contributors can create content" on public.content_items;
create policy "contributors can create content"
on public.content_items for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = auth.uid()
);

drop policy if exists "contributors can update content" on public.content_items;
create policy "contributors can update content"
on public.content_items for update to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (private.has_workspace_role(workspace_id, array['owner','admin','member']));

drop policy if exists "admins can delete content" on public.content_items;
create policy "admins can delete content"
on public.content_items for delete to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']));

drop policy if exists "admins can read audit events" on public.audit_events;
create policy "admins can read audit events"
on public.audit_events for select to authenticated
using (private.has_workspace_role(workspace_id, array['owner','admin']));

-- Policy definitions above are safely replaced on re-run, avoiding duplicate-policy SQLSTATE 42710.

-- Audit writes are reserved for a trusted server/Edge Function. No browser INSERT,
-- UPDATE or DELETE policy is granted, so clients cannot forge or rewrite audit records.
