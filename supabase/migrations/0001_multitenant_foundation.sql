-- BK-BusiCare multi-tenant foundation (Supabase PostgreSQL)
-- Apply only to a new Supabase project after reviewing the deployment guide.
-- No production data is included in this migration.

create extension if not exists pgcrypto;

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

-- SECURITY DEFINER helpers avoid recursive RLS checks on workspace_members.
create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, text[]) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

-- Atomic workspace creation: caller becomes its owner.
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql security definer
set search_path = public
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

revoke all on function public.create_workspace(text) from public;
grant execute on function public.create_workspace(text) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.content_items enable row level security;
alter table public.audit_events enable row level security;

create policy "workspace members can view workspaces"
on public.workspaces for select to authenticated
using (public.is_workspace_member(id));

create policy "workspace admins can update workspaces"
on public.workspaces for update to authenticated
using (public.has_workspace_role(id, array['owner','admin']))
with check (public.has_workspace_role(id, array['owner','admin']));

create policy "members can view workspace membership"
on public.workspace_members for select to authenticated
using (
  user_id = auth.uid()
  or public.has_workspace_role(workspace_id, array['owner','admin'])
);

create policy "members can view leads"
on public.leads for select to authenticated
using (public.is_workspace_member(workspace_id));

create policy "contributors can create leads"
on public.leads for insert to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = auth.uid()
);

create policy "contributors can update leads"
on public.leads for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy "admins can delete leads"
on public.leads for delete to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members can view content"
on public.content_items for select to authenticated
using (public.is_workspace_member(workspace_id));

create policy "contributors can create content"
on public.content_items for insert to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = auth.uid()
);

create policy "contributors can update content"
on public.content_items for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy "admins can delete content"
on public.content_items for delete to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "admins can read audit events"
on public.audit_events for select to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members can append audit events"
on public.audit_events for insert to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner','admin','member'])
  and actor_id = auth.uid()
);

-- Deliberately no client-side policies for membership writes. Invitations and
-- role changes must be implemented by a trusted server/Edge Function.
