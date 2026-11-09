# PetBook

Pet grooming and veterinary booking platform for the Philippines. The current product is a Next.js 15 app backed by Directus 11 and PostgreSQL. It includes customer booking and pet records, shop operations, GPS shop discovery, PayMongo online payments, and a live admin revenue dashboard.

The older Laravel code in `backend/` and the legacy MySQL Directus install in `cms/` are not used by the current app.

## Stack

- **Web:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- **CMS / API:** Directus 11 with PostgreSQL
- **Maps:** OpenStreetMap tiles via Leaflet, browser GPS for near-me sorting
- **Payments:** PayMongo hosted checkout for GCash, Maya, GrabPay, QR Ph and cards
- **Containers:** Docker Compose for PostgreSQL, Directus, schema setup, seed and web

## Project layout

```
petbook/
  web/        Next.js application and API routes
  directus/   Directus schema setup and demo seed scripts
  backend/    Legacy Laravel API (not used)
  cms/        Legacy Directus/MySQL install (not used)
  docker-compose.yml
  .env.example
```

## Features

### Customers

- Register, sign in, manage profile and pets
- Browse shops and services
- Find nearby shops with a map and GPS distance sorting
- Book appointments with slot availability
- Pay online or at the shop
- View appointments, QR check-in codes, loyalty points and reminders
- Receive booking updates in the notification bell and rejection reasons on appointments

### Shop owners

- Dashboard for pending requests, today's visits and monthly revenue
- Confirm or decline pending bookings with a customer-visible reason
- Manage appointments, services, staff and shop profile
- Capture a shop GPS pin for map discovery
- View revenue and service reports without commission details

### Platform admin

- Custom revenue dashboard at `/admin`
- Live graph polling every 10 seconds
- Gross booking revenue, platform commission, pending settlement and online collections
- Top shops by revenue and recent commission payments (admin-only visibility)
- Directus admin link for content and raw data management

## Quick start with Docker

```powershell
copy .env.example .env
# edit secrets in .env
docker compose up -d postgres directus
docker compose run --rm setup
docker compose run --rm seed
docker compose up -d web
```

Open:

- Web: <http://localhost:3000>
- Directus admin: <http://localhost:8055/admin>

### Demo accounts

Password for all seeded accounts: `PetBook123!`

| Role | Email |
| --- | --- |
| Shop owner | `maria@petbook.io` |
| Shop owner | `paolo@petbook.io` |
| Shop owner | `ana@petbook.io` |
| Customer | `jasmine@petbook.io` |
| Customer | `miguel@petbook.io` |

## Local development without Docker

Start PostgreSQL and Directus first, or point the app at an existing Directus instance.

```powershell
cd web
npm install
copy .env.example .env
npm run setup
npm run seed
npm run dev
```

`npm run setup` and `npm run seed` read credentials from `.env`, `../.env` or `../directus/.env`. The setup script is safe to re-run: existing collections, fields, relations and roles are kept.

### Environment

Copy `web/.env.example` to `web/.env` for local Next.js development:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DIRECTUS_URL=http://127.0.0.1:8055
DIRECTUS_URL=http://127.0.0.1:8055
DIRECTUS_ADMIN_EMAIL=admin@petbook.io
DIRECTUS_ADMIN_PASSWORD=PetBook123!

COMMISSION_RATE=10
CRON_SECRET=dev-cron-secret
PAYMENT_PROVIDER=mock
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=dev-paymongo-webhook-secret
PAYMONGO_PAYMENT_METHODS=gcash,maya,grab_pay,qrph,card
```

Use `PAYMENT_PROVIDER=paymongo` and a real secret key to enable hosted checkout. With `PAYMENT_PROVIDER=mock`, payments are recorded locally for testing.

## Maps and GPS

Shop coordinates live on `shops.latitude` and `shops.longitude` (decimal, 10, 7). Shop owners can type coordinates or press **Use my location** in shop settings. On `/shops`, customers can press **Use my location** to sort shops by distance and center the OpenStreetMap view on their position. Shop detail pages include a map pin and Google Maps directions link. No map API key is required.

## Booking workflow

New bookings start as `pending`. Shop owners can confirm or decline them from `/shop/appointments?status=pending`. Declining requires a reason, which is saved to `appointments.rejection_reason`, sent to the customer as a system notification, and shown on the customer's appointment list and detail page.

System notifications and upcoming reminders appear in the header notification bell. The modal marks updates as seen locally and links back to the relevant appointment.

## Payments and admin revenue

Customers can pay for appointments online through PayMongo or at the shop. Completed appointments create a transaction with a platform commission, defaulting to 10%. Commission details are visible only in the admin revenue dashboard; shop and customer screens show booking revenue without commission or payout breakdowns.

Commission checkout records are stored in `commission_payments`. The admin dashboard shows pending commission, settled commission, online commission collections, and recent commission payments.

Register these PayMongo webhook events:

- `checkout_session.payment.paid`
- `checkout_session.payment.failed`

Webhook URL: `https://your-domain.example/api/payments/webhook`

## Scheduled reminders

```powershell
curl -X POST https://your-domain.example/api/cron/reminders `
  -H "X-Cron-Secret: $env:CRON_SECRET"
```

## Commands

```powershell
cd web
npm run typecheck
npm run build
npm run setup
npm run seed
```

## Business rules

- New bookings require shop confirmation; declined bookings must include a customer-visible reason.
- Platform commission defaults to **10%** of each completed appointment and is shown only to admins.
- Customers earn loyalty points based on `LOYALTY_POINTS_PER_HUNDRED`.
- Upcoming reminders are scheduled after a shop confirms a visit; follow-ups are scheduled after completion.
- Admin revenue metrics are calculated from paid transactions and commission payments.
