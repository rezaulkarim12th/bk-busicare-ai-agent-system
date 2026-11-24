-- SSLCOMMERZ payment tables must remain server-only.
-- Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select ok(to_regclass('public.product_catalog') is not null, 'product catalogue table exists');
select ok(to_regclass('public.orders') is not null, 'orders table exists');
select ok(to_regclass('public.payment_transactions') is not null, 'payment transactions table exists');

select ok((select relrowsecurity from pg_class where oid='public.product_catalog'::regclass), 'product catalogue has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.orders'::regclass), 'orders has RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.payment_transactions'::regclass), 'payment transactions has RLS enabled');

select ok(not has_table_privilege('anon', 'public.product_catalog', 'SELECT'), 'anon cannot read product catalogue');
select ok(not has_table_privilege('anon', 'public.orders', 'SELECT'), 'anon cannot read orders');
select ok(not has_table_privilege('anon', 'public.payment_transactions', 'SELECT'), 'anon cannot read payment transactions');

select ok(not has_table_privilege('authenticated', 'public.product_catalog', 'SELECT'), 'authenticated cannot read product catalogue');
select ok(not has_table_privilege('authenticated', 'public.orders', 'SELECT'), 'authenticated cannot read orders');
select ok(not has_table_privilege('authenticated', 'public.payment_transactions', 'SELECT'), 'authenticated cannot read payment transactions');

select ok(has_table_privilege('service_role', 'public.product_catalog', 'SELECT'), 'service_role can read product catalogue');
select ok(has_table_privilege('service_role', 'public.orders', 'SELECT'), 'service_role can read orders');
select ok(has_table_privilege('service_role', 'public.payment_transactions', 'SELECT'), 'service_role can read payment transactions');

select ok(exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='product_catalog'
    and policyname='deny browser access to product_catalog' and cmd='ALL'
), 'product catalogue has explicit browser deny policy');
select ok(exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='orders'
    and policyname='deny browser access to orders' and cmd='ALL'
), 'orders has explicit browser deny policy');
select ok(exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='payment_transactions'
    and policyname='deny browser access to payment_transactions' and cmd='ALL'
), 'payment transactions has explicit browser deny policy');

select * from finish();
rollback;
