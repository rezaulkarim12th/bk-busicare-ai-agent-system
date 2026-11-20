-- Production performance hardening for existing tenant-scoped policies.
-- Idempotent: indexes are created only when missing and policies are safely replaced.

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists content_items_created_by_idx on public.content_items(created_by);
create index if not exists leads_created_by_idx on public.leads(created_by);

drop policy if exists "members can view workspace membership" on public.workspace_members;
create policy "members can view workspace membership"
on public.workspace_members for select to authenticated
using (user_id = (select auth.uid()) or private.has_workspace_role(workspace_id, array['owner','admin']));

drop policy if exists "contributors can create leads" on public.leads;
create policy "contributors can create leads"
on public.leads for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = (select auth.uid())
);

drop policy if exists "contributors can create content" on public.content_items;
create policy "contributors can create content"
on public.content_items for insert to authenticated
with check (
  private.has_workspace_role(workspace_id, array['owner','admin','member'])
  and created_by = (select auth.uid())
);