-- 견적서 앱 초기 마이그레이션 — PLAN.md 4·5장 기준.
-- Supabase 프로젝트 생성 후 SQL Editor에 붙여넣거나 supabase db push로 적용한다.
-- 요구: PostgreSQL 15+ (on delete set null (column) 구문).

-- ============================================================
-- 1. 테이블
-- ============================================================

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  business_number text not null,
  name text not null,
  ceo_name text,
  address text,
  phone text,
  logo_path text,
  stamp_path text,
  bank_account text,
  is_tax_free boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  business_number text,
  ceo_name text,
  address text,
  contact text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_owner_name_idx on customers (owner_id, name);
create unique index if not exists customers_owner_id_idx on customers (owner_id, id);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  spec text,
  unit text,
  unit_price numeric(14,0) not null default 0,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_owner_name_idx on items (owner_id, name);
create unique index if not exists items_owner_id_idx on items (owner_id, id);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  quote_number text not null,
  customer_id uuid,
  issue_date date not null default current_date,
  valid_until date,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'canceled')),
  supply_amount numeric(14,0) not null default 0,
  vat_amount numeric(14,0) not null default 0,
  total_amount numeric(14,0) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, quote_number),
  unique (owner_id, id),
  foreign key (owner_id, customer_id) references customers(owner_id, id)
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  quote_id uuid not null,
  item_id uuid,
  item_name text not null,
  spec text,
  unit text,
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,0) not null check (unit_price >= 0),
  amount numeric(14,0) not null
    generated always as (floor(quantity * unit_price)) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  foreign key (owner_id, quote_id) references quotes(owner_id, id) on delete cascade,
  foreign key (owner_id, item_id) references items(owner_id, id) on delete set null (item_id)
);
create index if not exists quote_items_quote_idx on quote_items (owner_id, quote_id, sort_order);

create table if not exists quote_counters (
  owner_id uuid not null references auth.users(id),
  year_month text not null,
  last_seq int not null default 0,
  primary key (owner_id, year_month)
);

-- ============================================================
-- 2. updated_at 자동 갱신
-- ============================================================

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_companies_touch on companies;
create trigger trg_companies_touch before update on companies
  for each row execute function touch_updated_at();
drop trigger if exists trg_customers_touch on customers;
create trigger trg_customers_touch before update on customers
  for each row execute function touch_updated_at();
drop trigger if exists trg_items_touch on items;
create trigger trg_items_touch before update on items
  for each row execute function touch_updated_at();
drop trigger if exists trg_quotes_touch on quotes;
create trigger trg_quotes_touch before update on quotes
  for each row execute function touch_updated_at();

-- ============================================================
-- 3. 채번 RPC — next_quote_number (PLAN.md §4-6)
-- ============================================================

create or replace function next_quote_number(p_year_month text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_seq int;
begin
  insert into quote_counters (owner_id, year_month, last_seq)
  values (auth.uid(), p_year_month, 1)
  on conflict (owner_id, year_month)
  do update set last_seq = quote_counters.last_seq + 1
  returning last_seq into v_seq;

  return p_year_month || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

-- ============================================================
-- 4. 원자적 저장 RPC — save_quote (PLAN.md §4-7)
-- ============================================================

create or replace function save_quote(p_quote jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_is_new    boolean := (p_quote->>'id') is null;
  v_quote_id  uuid := coalesce((p_quote->>'id')::uuid, gen_random_uuid());
  v_number    text := p_quote->>'quote_number';
  v_supply    numeric(14,0);
  v_vat       numeric(14,0);
  v_tax_free  boolean;
begin
  if v_number is null then
    if v_is_new then
      v_number := next_quote_number(to_char(coalesce((p_quote->>'issue_date')::date, current_date), 'YYYYMM'));
    else
      select quote_number into v_number from quotes where id = v_quote_id and owner_id = v_uid;
    end if;
  end if;

  insert into quotes (id, owner_id, quote_number, customer_id, issue_date, valid_until, status, notes)
  values (v_quote_id, v_uid, v_number,
          (p_quote->>'customer_id')::uuid,
          coalesce((p_quote->>'issue_date')::date, current_date),
          (p_quote->>'valid_until')::date,
          coalesce(p_quote->>'status', 'draft'),
          p_quote->>'notes')
  on conflict (id) do update
    set customer_id = excluded.customer_id,
        issue_date  = excluded.issue_date,
        valid_until = excluded.valid_until,
        status      = excluded.status,
        notes       = excluded.notes,
        updated_at  = now();

  delete from quote_items where owner_id = v_uid and quote_id = v_quote_id;
  insert into quote_items (owner_id, quote_id, item_id, item_name, spec, unit, quantity, unit_price, sort_order)
  select v_uid, v_quote_id,
         (e->>'item_id')::uuid, e->>'item_name', e->>'spec', e->>'unit',
         (e->>'quantity')::numeric, (e->>'unit_price')::numeric,
         coalesce((e->>'sort_order')::int, ordinality::int)
  from jsonb_array_elements(p_items) with ordinality as t(e, ordinality);

  select coalesce(sum(amount), 0) into v_supply
  from quote_items where owner_id = v_uid and quote_id = v_quote_id;

  select is_tax_free into v_tax_free from companies where owner_id = v_uid;
  v_vat := case when coalesce(v_tax_free, false) then 0 else floor(v_supply * 0.1) end;

  update quotes
     set supply_amount = v_supply,
         vat_amount    = v_vat,
         total_amount  = v_supply + v_vat,
         updated_at    = now()
   where id = v_quote_id and owner_id = v_uid;

  return v_quote_id;
end;
$$;

-- ============================================================
-- 5. RLS — 모든 테이블 소유자 격리 (PLAN.md §5)
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array['companies','customers','items','quotes','quote_items','quote_counters']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I on %I;', t||'_owner_all', t);
    execute format(
      'create policy %I on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t||'_owner_all', t);
  end loop;
end $$;

-- ============================================================
-- 6. Storage 정책 — 로고/직인 (PLAN.md §5)
-- ============================================================
-- 버킷 'company-assets'를 비공개로 먼저 생성한 뒤 아래 정책을 적용한다.
-- 경로 규칙: {owner_id}/logo/*, {owner_id}/stamp/*

-- insert into storage.buckets (id, name, public) values ('company-assets','company-assets', false)
--   on conflict (id) do nothing;

-- create policy "asset_owner_all" on storage.objects for all
--   using (bucket_id = 'company-assets' and (storage.foldername(name))[1] = auth.uid()::text)
--   with check (bucket_id = 'company-assets' and (storage.foldername(name))[1] = auth.uid()::text);
