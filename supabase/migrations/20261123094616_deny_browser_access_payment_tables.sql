-- Browser clients must not access the server-owned commerce/payment tables.
-- Trusted Edge Functions use the service_role key on the server only.

revoke all on public.product_catalog from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;

grant all on public.product_catalog to service_role;
grant all on public.orders to service_role;
grant all on public.payment_transactions to service_role;

drop policy if exists "deny browser access to product_catalog" on public.product_catalog;
create policy "deny browser access to product_catalog"
on public.product_catalog for all to anon, authenticated
using (false) with check (false);

drop policy if exists "deny browser access to orders" on public.orders;
create policy "deny browser access to orders"
on public.orders for all to anon, authenticated
using (false) with check (false);

drop policy if exists "deny browser access to payment_transactions" on public.payment_transactions;
create policy "deny browser access to payment_transactions"
on public.payment_transactions for all to anon, authenticated
using (false) with check (false);

comment on table public.product_catalog is 'Server-managed catalogue; prices are authoritative only when set by an authorized store operator.';
comment on table public.orders is 'Server-owned order records; totals are calculated from product_catalog, never browser input.';
comment on table public.payment_transactions is 'Server-only SSLCOMMERZ transaction ledger; IPN is trusted only after provider-side validation.';
