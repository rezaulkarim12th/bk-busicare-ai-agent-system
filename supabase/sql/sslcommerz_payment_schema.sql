-- BK-BusiCare TEST payment foundation.
-- Prices and product availability are server-owned; the browser cannot write these tables.

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text not null default '',
  kind text not null check (kind in ('digital','service','physical')),
  unit_price numeric(12,2) not null check (unit_price between 10 and 500000),
  currency text not null default 'BDT' check (currency = 'BDT'),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  currency text not null default 'BDT' check (currency = 'BDT'),
  amount numeric(12,2) not null check (amount between 10 and 500000),
  items_snapshot jsonb not null
    check (jsonb_typeof(items_snapshot) = 'array' and jsonb_array_length(items_snapshot) between 1 and 50),
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
create index if not exists product_catalog_active_idx on public.product_catalog(active, sku);

alter table public.product_catalog enable row level security;
alter table public.orders enable row level security;
alter table public.payment_transactions enable row level security;

revoke all on public.product_catalog from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;

grant all on public.product_catalog to service_role;
grant all on public.orders to service_role;
grant all on public.payment_transactions to service_role;

comment on table public.product_catalog is 'Server-managed catalogue; prices are authoritative only when set by an authorized store operator.';
comment on table public.orders is 'Server-owned order records; totals are calculated from product_catalog, never browser input.';
comment on table public.payment_transactions is 'Server-only SSLCOMMERZ transaction ledger; IPN is trusted only after provider-side validation.';
