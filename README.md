# TableBook v1

TableBook v1 on Next.js (app router) + TypeScript + Tailwind + Supabase.

## Stack

- Next.js + React + TypeScript
- TailwindCSS
- Supabase (Postgres)
- Vitest
- GitHub Actions CI
- Deploy targets: Vercel + Supabase

## Features

- Pages: `Search`, `Results`, `Availability`, `NoAvailability`, `Confirmation`
- RU/EN localization for UI and data fields
- API:
  - `GET /api/restaurants?cuisine=&district=&limit=&offset=`
  - `GET /api/restaurants/:id`
  - `POST /api/bookings`
  - `POST /api/events`
- Event logging in `events` for all booking and alternatives actions
- Seed pipeline for 1000+ Moscow restaurants with bbox coordinates

## Environment

Copy `.env.example` to `.env.local` and fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Setup

```bash
pnpm install
pnpm dev
```

## Database migration

Apply SQL from:

- `supabase/migrations/0001_init.sql`

## Generate and seed mock data

```bash
pnpm generate:restaurants --count=1000
pnpm seed
```

Files:

- `fixtures/restaurants.json`
- `fixtures/restaurants.json.gz`

## Deploy

### Supabase

1. Create project in Supabase
2. Apply migration SQL
3. Add env values to Vercel

### Vercel

1. Import repository
2. Set env vars from `.env.example`
3. Deploy

## SQL queries for metrics

### Alternative booking conversion

```sql
SELECT

  CASE WHEN denominator.cnt = 0 THEN 0

       ELSE (COALESCE(numerator.cnt,0)::numeric / denominator.cnt)

  END AS alternative_booking_conversion

FROM

  (SELECT COUNT(*) AS cnt FROM events WHERE event_name='alternative_booking_success') numerator,

  (SELECT COUNT(*) AS cnt FROM events WHERE event_name='alternatives_shown') denominator;
```

### Average revenue per booking and estimated alternative revenue

```sql
WITH subs AS (

  SELECT COALESCE(SUM(total_revenue_cents),0) AS total_sub_cents

  FROM subscriptions_revenue WHERE month = '2025-04'

), bookings AS (

  SELECT COUNT(*) AS total_bookings FROM bookings

    WHERE date >= '2025-04-01' AND date < '2025-05-01'

), alt_bookings AS (

  SELECT COUNT(*) AS alt_count FROM bookings

    WHERE source IN ('ai-alternative','quick-book') AND date >= '2025-04-01' AND date < '2025-05-01'

)

SELECT

  subs.total_sub_cents,

  bookings.total_bookings,

  alt_bookings.alt_count,

  CASE WHEN bookings.total_bookings = 0 THEN 0 ELSE (subs.total_sub_cents::numeric / bookings.total_bookings) END AS avg_revenue_per_booking_cents,

  CASE WHEN bookings.total_bookings = 0 THEN 0 ELSE (subs.total_sub_cents::numeric / bookings.total_bookings) * alt_bookings.alt_count END AS estimated_revenue_from_alternative_bookings_cents

FROM subs, bookings, alt_bookings;
```
