create extension if not exists "pgcrypto";

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ru text not null,
  cuisine_en text not null,
  cuisine_ru text not null,
  district_en text not null,
  district_ru text not null,
  price_level int not null check (price_level between 1 and 4),
  rating numeric(2,1) not null check (rating between 3.0 and 5.0),
  distance_km numeric(4,2) not null check (distance_km >= 0),
  has_availability boolean not null default false,
  tables jsonb not null default '[]'::jsonb,
  lat numeric(8,6) not null check (lat between 55.55 and 55.95),
  lng numeric(8,6) not null check (lng between 37.35 and 37.85),
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id text not null,
  date date not null,
  time time not null,
  guests int not null check (guests > 0),
  source text not null check (source in ('direct','ai-alternative','quick-book')),
  created_at timestamptz not null default now(),
  revenue_cents int not null default 0
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  user_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions_revenue (
  month text not null,
  total_revenue_cents int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurants_cuisine_en on restaurants (cuisine_en);
create index if not exists idx_restaurants_district_en on restaurants (district_en);
create index if not exists idx_bookings_source on bookings (source);
create index if not exists idx_events_event_name on events (event_name);
