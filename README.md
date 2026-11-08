# PetBook

Pet grooming and veterinary booking platform for the Philippines. A Laravel REST API powers bookings, reminders, loyalty points, medical records and the 10% platform commission. Directus provides the CMS/admin front-end over the same MySQL database.

## Stack

- **Backend:** Laravel 10, PHP 8.1, MySQL 8, Sanctum
- **CMS:** Directus 11.17.4 on Node.js 20/22 (used for admin and role-scoped data entry)
- **SMS:** Twilio (or the `log` driver in development)
- **Payments:** PayMongo hosted checkout — GCash, Maya, GrabPay, QR Ph and Visa/Mastercard

## Project layout

```
petbook/
  backend/   Laravel API, migrations, seeders, tests
  cms/       Directus CMS, setup script and flow configuration
```

## Backend setup

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
# set DB_DATABASE / DB_USERNAME / DB_PASSWORD in .env
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

Never run `php artisan migrate:fresh` against the shared database: it would drop the Directus tables. Use `php artisan migrate`.

Demo accounts created by the seeder (password `password`):

| Role | Email |
| --- | --- |
| Platform admin | `admin@petbook.app` |
| Business owner | `owner@petbook.app` |
| Pet owner | `customer@petbook.app` |

## Directus setup

Directus 11 requires Node.js 20–22. A portable Node 22 runtime is used in development at `cms/.node22/` (gitignored).

```powershell
cd cms
npm install
npm run setup
npm start
```

The setup script registers the Laravel tables as Directus collections, adds `business` / `app_role` / `app_user` to CMS users, creates the Pet Owner and Business Owner roles, applies scoped permissions, and installs the appointment → Laravel webhook flow.

Default CMS admin: `admin@petbook.io` / `PetbookAdmin123!`.

## Payments (PayMongo)

PayMongo is the default Philippine gateway. Create an account at <https://dashboard.paymongo.com>, then copy the keys into `backend/.env`:

```dotenv
PAYMENT_PROVIDER=paymongo
PAYMENT_CURRENCY=PHP
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
PAYMONGO_BASE_URL=https://api.paymongo.com/v1
PAYMONGO_PAYMENT_METHODS=gcash,maya,grab_pay,qrph,card
PAYMENT_SUCCESS_URL=https://your-cms.example.com/admin/content/transactions?payment=success
PAYMENT_CANCEL_URL=https://your-cms.example.com/admin/content/transactions?payment=cancelled
```

Register the webhook in the PayMongo dashboard:

- URL: `https://your-api.example.com/api/webhooks/paymongo`
- Events: `checkout_session.payment.paid`, `payment.paid`, `checkout_session.payment.failed`

### Payment API

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/payments/checkout` | Pet owner | Create a PayMongo checkout for an appointment, package purchase or transaction |
| `GET` | `/api/payments` | Any signed-in user | List payments visible to the user |
| `GET` | `/api/payments/{transaction}` | Any signed-in user | Payment/commission details |
| `POST` | `/api/payments/{transaction}/cash-paid` | Business owner/staff, admin | Record an offline cash payment |
| `POST` | `/api/webhooks/paymongo` | PayMongo | Signature-verified payment status webhook |

Example checkout request:

```json
{
  "appointment_id": 1,
  "payment_methods": ["gcash", "maya", "qrph"]
}
```

The response contains `checkout_url`; redirect the customer there. When PayMongo confirms payment, the webhook sets `payment_status=paid`, records the payment method/reference and timestamp on the transaction.

Cash payments remain supported for walk-ins and are recorded through the `cash-paid` endpoint.

## Scheduling

```powershell
php artisan schedule:run
```

- `petbook:send-reminders` — sends due SMS reminders every five minutes
- `petbook:reconcile-appointments` — hourly completion/commission reconciliation

The scheduler endpoint `POST /api/cron/reminders/process` is protected by the `X-Cron-Secret` header (`CRON_SECRET`).

## Tests

Tests use a separate MySQL database (`petbook_test`) configured in `phpunit.xml`:

```powershell
cd backend
php artisan test
```

Coverage includes registration/login, appointment completion (commission, loyalty, medical record, follow-up reminder), appointment permissions, PayMongo checkout, webhook signature validation, and cash payment recording.

## Business rules

- Platform commission defaults to **10%** of each completed appointment or package purchase.
- Customers earn **1 loyalty point per PHP 1** spent on a completed appointment.
- Upcoming reminders are scheduled 24 hours before a visit; follow-ups are scheduled 3 days after completion.
- The platform admin settles commissions with `PATCH /api/commissions/{transaction}/mark-paid`.
