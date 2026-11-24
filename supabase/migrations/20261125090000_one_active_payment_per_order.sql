-- Allow at most one active SSLCOMMERZ attempt per order.
-- Failed/cancelled attempts release the order for a deliberate retry.
create unique index if not exists payment_transactions_one_active_per_order_idx
  on public.payment_transactions (order_id)
  where status in ('initiated', 'pending');
