-- Historical production hardening migration.
-- On fresh/local stacks the event-trigger function may not be installed, so guard it.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated, service_role';
  end if;
end;
$$;
