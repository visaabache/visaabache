# Architecture

## Overview

```
Browser ──HTTPS──► Next.js 15 (App Router)
                    ├─ middleware.ts ............ locale prefix (/fr, /ar, /en) + redirect
                    ├─ Server Components ........ pages read PostgreSQL through Prisma
                    ├─ Server Actions ........... all mutations (forms), validated with zod, permission-checked
                    ├─ Route Handlers (/api) .... document download, ZIP, CSV export, CMI callback, cron, data export
                    └─ lib/ ..................... domain logic, notifications, storage, payments
                           │
          ┌────────────────┼────────────────────┬──────────────────────┐
     PostgreSQL     Encrypted storage       Email (SMTP/Resend)   CMI / WhatsApp Cloud API
     (Supabase)     (local disk or S3)
```

All pages render on demand (`force-dynamic`), so anything edited in the admin panel shows up immediately.

## Directory layout

```
prisma/
  schema.prisma            Data model (30+ tables)
  migrations/              SQL migrations
  seed.ts, seed-data/      Reference data (destinations, checklists, services, templates, legal pages)
src/
  middleware.ts            Locale routing
  app/
    [locale]/layout.tsx    <html lang dir> (RTL for Arabic), cookie consent, analytics
    [locale]/(site)/       Public website + customer area (/account) + wizard (/apply)
    [locale]/admin/        Back office (own layout, role-filtered navigation)
    api/                   Route handlers
    sitemap.ts, robots.ts  SEO
  actions/                 Server Actions (auth, public, apply, account, admin/*)
  components/              UI kit (ui/), layout, site, account, admin, apply wizard
  lib/
    auth/                  Sessions, passwords, RBAC permissions
    i18n/                  Locale config, dictionaries (en.ts = typed source of truth), helpers
    domain/                Applications, checklist rules, pricing, invoices, payments, automation
    notify/                Email, WhatsApp, templated notifications
    payments/cmi.ts        CMI hash (ver3) + request builder
    storage/               AES-256-GCM encryption + local/S3 drivers
    settings.ts            Typed settings with defaults (stored as JSON)
tests/unit, tests/e2e      Vitest + Playwright suites
```

## Data model (main tables)

| Domain | Tables |
|---|---|
| Identity | `User` (role CUSTOMER/STAFF/ADMIN/OWNER), `Session`, `VerificationToken`, `RateLimit` |
| Destinations | `Country`, `VisaType`, `ChecklistItem` (rules: visa types + answer condition), `Question` (country-specific, or global when `countryId` is null), `OfficialLink`, `Faq` |
| Catalogue | `Service` (category, price type), `Package`, `DiscountCode` |
| Applications | `Application` (reference, applicant, travel, answers, checklist snapshot, pricing, deadline, assignee), `ApplicationStatus` (customisable), `ApplicationStatusHistory`, `ApplicationNote` (internal), `Document` (encrypted file metadata), `DocumentRequest` (missing documents) |
| Finance | `Invoice` (sequential numbering through `Counter`), `Payment` (status machine), `Refund` |
| Communication | `Inquiry`, `Ticket`, `TicketMessage`, `Notification` (in-app), `NotificationTemplate` (key × channel × locale), `NotificationLog` |
| Marketing / content | `Testimonial` (verified + consent flags), `Article`, `Banner`, `LegalPage` |
| Compliance / ops | `ConsentRecord`, `DataRequest`, `AuditLog`, `AutomationRun`, `Setting` |

Localised content is stored as JSON: `{ "fr": "...", "ar": "...", "en": "..." }`. `tr(value, locale)` picks the right language and falls back to French, then English.

## Key flows

**Application wizard** (`components/apply/wizard.tsx` and `actions/apply.ts`)
1. Steps 1–4 run in the client. The checklist preview is computed with the same pure function the server uses (`lib/domain/checklist.ts`).
2. *Save & continue* calls `saveDraftAction`. It creates the account (with consent records) if needed, logs the user in, and stores a **draft** application with a server-computed checklist snapshot.
3. Uploads use `uploadDocumentAction`. Each file is checked by magic bytes (PDF/JPEG/PNG/WEBP), size-checked, encrypted, and stored under a random key.
4. `submitApplicationAction` re-validates the package and discount on the server, records consents, sets the initial status, generates the invoice, and notifies the customer and the admin.

**Status changes** go through `changeApplicationStatus()`, which writes the history and sends the notification (email + in-app + optional WhatsApp) when the status has `notifyCustomer`.

**Payments** use one status machine: `PENDING → (AWAITING_VERIFICATION) → CONFIRMED → (PARTIALLY_)REFUNDED`, or `FAILED`. Only two paths reach `CONFIRMED`:
- the CMI server-to-server callback, after verifying the hash, order id, amount and `ProcReturnCode=00`;
- an authorised administrator (`finance.manage`), with an audit entry.

The browser return URL from the gateway never confirms anything.

**Automation** (`lib/domain/automation.ts`) is idempotent. It is triggered hourly through `GET /api/cron/run` with a bearer `CRON_SECRET`, or manually from *Admin → Automation*.

## Permissions

| Permission | STAFF | ADMIN | OWNER |
|---|:-:|:-:|:-:|
| applications.view / manage, customers.view, inquiries, support | ✓ | ✓ | ✓ |
| customers.manage, finance.*, content, marketing, settings, compliance, automation, audit | | ✓ | ✓ |
| users.manage (team & roles) | | | ✓ |

Checks happen server-side in every page (`requireStaff`) and every action (`assertPermission`).

## Known issues

- **Intermittent hydration recovery in production builds.** About 1 in 60–100 page loads logs React error #418 in the browser console. It is not tied to a particular page and does not reproduce on the dev server. React re-renders the affected tree on the client, so pages work normally. It was more frequent on very heavy pages, which is why the admin editors render one form at a time and the wizard loads destination data on demand. The E2E suite reports these as warnings. Next step for investigation: reproduce with a React development build of the production bundle to get the component diff.

## Extending

- **New destination:** *Admin → Destinations → New* (no code needed).
- **New language string:** add the key to `src/lib/i18n/dictionaries/en.ts`. TypeScript then fails until `fr.ts` and `ar.ts` have it, and a unit test enforces parity.
- **New notification:** add a key to `TEMPLATE_KEYS` (`lib/notify/index.ts`) and templates in `prisma/seed-data/templates.ts`, then call `notify({ key, … })`.
- **New payment gateway:** add a module in `lib/payments/`, a callback route that verifies the provider signature, and call `confirmPayment()`.
- **Storage provider:** set `STORAGE_DRIVER=s3` with any S3-compatible endpoint (Supabase Storage, Cloudflare R2, AWS S3, OVH, Scaleway).
