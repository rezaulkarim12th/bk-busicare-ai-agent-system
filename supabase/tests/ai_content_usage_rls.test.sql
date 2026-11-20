-- Regression checks for the server-only AI quota ledger.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(
  (select c.relrowsecurity from pg_class c where c.oid = 'private.ai_content_usage'::regclass),
  'AI usage ledger has RLS enabled'
);
select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon cannot access the private schema'
);
select ok(
  not has_table_privilege('anon', 'private.ai_content_usage', 'SELECT'),
  'anon has no direct SELECT grant on usage ledger'
);
select ok(
  not has_table_privilege('authenticated', 'private.ai_content_usage', 'SELECT'),
  'authenticated has no direct SELECT grant on usage ledger'
);
select ok(
  has_table_privilege('service_role', 'private.ai_content_usage', 'SELECT')
  and has_table_privilege('service_role', 'private.ai_content_usage', 'INSERT')
  and has_table_privilege('service_role', 'private.ai_content_usage', 'DELETE'),
  'service_role retains only the required ledger operations'
);
select ok(
  exists (
    select 1
    from pg_policy p
    where p.polrelid = 'private.ai_content_usage'::regclass
      and p.polname = 'service_role_manage_ai_content_usage'
      and p.polcmd = '*'
      and p.polroles = array[(select oid from pg_roles where rolname = 'service_role')]::oid[]
  ),
  'the only application policy is scoped to service_role'
);

select * from finish();
rollback;
