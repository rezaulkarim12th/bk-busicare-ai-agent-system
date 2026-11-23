-- BK-BusiCare SSLCOMMERZ sandbox foundation.
-- Review and apply only through the project's migration workflow.
-- No browser role receives access; only trusted server functions may write.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  currency text not null default 'BDT' check (currency = 'BDT'),
  amount numeric(12,2) not null check (amount between 10 and 500000),
  items_snapshot jsonb not null check (jsonb_typeof(items_snapshot) = 'array'),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_city text not null,
  customer_country text not null default 'Bangladesh',
  status text not null default 'pending'
    check (status in ('pending','paid','payment_failed','cancelled','manual_review','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null default 'sslcommerz' check (provider = 'sslcommerz'),
  tran_id text not null unique,
  val_id text unique,
  amount numeric(12,2) not null check (amount between 10 and 500000),
  currency text not null default 'BDT' check (currency = 'BDT'),
  status text not null default 'initiated'
    check (status in ('initiated','pending','validated','failed','cancelled','manual_review','refunded')),
  risk_level integer,
  provider_status text,
  validation_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists payment_transactions_order_idx on public.payment_transactions(order_id);

alter table public.orders enable row level security;
alter table public.payment_transactions enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;
grant all on public.orders to service_role;
grant all on public.payment_transactions to service_role;

comment on table public.orders is 'Server-owned order records. Never accept amount or item prices from the browser.';
comment on table public.payment_transactions is 'Server-only SSLCOMMERZ transaction ledger; IPN is trusted only after provider-side validation.';
