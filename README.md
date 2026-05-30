# TableBook v2

Cross-platform restaurant booking (**ЗаСтолом** — ru UI): Expo (iOS/Android/Web PWA) + Next.js API + self-hosted Postgres.

## Stack

- **apps/mobile** — Expo Router (React Native + Web/PWA)
- **apps/api** — Next.js API-only (`/api/v1/*`)
- **packages/shared** — types, i18n, business logic
- **packages/db** — Drizzle ORM + migrations + seed
- **packages/api-client** — typed HTTP client

## Prerequisites (macOS)

```bash
brew install node pnpm postgresql@16
brew services start postgresql@16
createuser tablebook -s || true
createdb tablebook || true
```

## Setup

```bash
cp .env.example apps/api/.env.local
cp .env.example apps/mobile/.env.local   # use EXPO_PUBLIC_API_URL line
pnpm install
pnpm db:migrate
pnpm db:seed   # 10 fixed test restaurants (removes old generated data)
```

## Development (single MacBook)

```bash
# Terminal 1
pnpm dev                    # API → http://localhost:3000

# Terminal 2
pnpm mobile:dev             # Expo → i / w / a
```

- iOS Simulator: `localhost:3000`
- Physical iPhone: set `EXPO_PUBLIC_API_URL=http://192.168.15.88:3000`

## API endpoints (v1)

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `GET/PATCH /api/v1/me`, `GET /api/v1/me/bookings`
- `GET /api/v1/restaurants`, `GET /api/v1/restaurants/:id`
- `GET /api/v1/restaurants/:id/availability`
- `POST /api/v1/bookings` (auth required)
- `GET/POST /api/v1/restaurants/:id/reviews`
- B2B: `POST /api/v1/restaurants/onboard`, owner tables/bookings
- `POST /api/v1/bookings/:id/request-review` — owner sends review reminder email
- `POST /api/v1/cron/review-reminders` — batch send reminders (header `Authorization: Bearer $CRON_SECRET`)

Schedule review reminders (e.g. hourly):

```bash
curl -X POST http://localhost:3000/api/v1/cron/review-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Optional Docker (Postgres only)

```bash
POSTGRES_PASSWORD=password docker compose up -d
```

## Production (VPS)

See [`deploy/nginx.conf`](deploy/nginx.conf) and [`deploy/tablebook-api.service`](deploy/tablebook-api.service).

1. Install Postgres 16 + Node 20 + pnpm
2. Clone repo to `/opt/tablebook`, copy `.env.production` to `apps/api/`
3. `pnpm install && pnpm db:migrate && pnpm db:seed && pnpm build`
4. Enable systemd unit for API
5. Build mobile web: `pnpm --filter @tablebook/mobile build`
6. Point Nginx to API (:3000) and static files (`apps/mobile/dist`)
7. Schedule `pg_dump tablebook` backups via cron
