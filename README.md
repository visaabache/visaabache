# VISA ABACHE

**Your Journey Starts With the Right Guidance.**

Visa assistance and digital administrative services platform for the Moroccan market. It covers the public website, the application system, the customer area and the back office, and it is built so that **one person can run hundreds of files** with help from automation.

> VISA ABACHE is an independent assistance business. It is not an embassy, consulate, visa centre or government authority, and it never guarantees visa approval. The platform says this on every relevant page.

## What's included

| Area | Highlights |
|---|---|
| **Public website** (FR · العربية RTL · EN) | Premium homepage with destination search, 26 destination guides (visa types, checklist, procedure, appointments, indicative processing times, official fees kept separate from service fees, official links, FAQs), service pages with an inquiry form, pricing, blog, FAQ, contact, legal pages, public tracking by reference |
| **Smart application wizard** | Destination → visa type → personal and travel details → destination-specific questions → **personalised checklist** (rule engine) → encrypted uploads → package and discount code → consents → reference number |
| **Customer dashboard** | Applications and progress timeline, requested documents, uploads and downloads, invoices (printable or PDF), payments (CMI card, bank transfer with receipt, cash), notifications, support messages, profile, data export and deletion request (Law 09-08) |
| **Admin dashboard** | KPIs and to-do counters, setup checklist, revenue chart, application workspace (statuses, document review, missing-document requests, internal notes, deadlines, assignee, ZIP export, WhatsApp shortcuts), customers, inquiries, support, payments and refunds, invoices, monthly reports and CSV exports, destination and requirement editor, services, packages, statuses, blog, FAQs, legal pages, testimonials (verified only), banners, discount codes, editable FR/AR/EN notification templates, settings, team roles, data-protection requests, automation runs, audit log |
| **Automation** (hourly) | Missing-document reminders, payment reminders, archiving, document deletion under the retention policy, draft cleanup, optional anonymisation, session purge |
| **Security** | Encrypted documents (AES-256-GCM), private storage, file-type sniffing, bcrypt passwords, HMAC-hashed sessions, role-based access, rate limiting, CSP and security headers, audit trail, consent records |

## Tech stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL (Supabase-compatible) · local or S3-compatible encrypted storage (Supabase Storage, R2, S3) · SMTP or Resend email · WhatsApp click-to-chat plus optional WhatsApp Cloud API · CMI hosted payment page.

## Quick start (local)

```bash
cp .env.example .env              # then fill in the values (see comments)
openssl rand -base64 32           # → DOCUMENT_ENCRYPTION_KEY
openssl rand -base64 48           # → SESSION_SECRET
npm install
npx prisma migrate deploy         # create tables
npm run db:seed                   # statuses, destinations, services, packages, templates, legal pages, owner account
npm run dev                       # http://localhost:3000
```

The owner account comes from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. You can also run `npm run admin:create -- you@domain.ma "First" "Last"`. Then sign in at `/fr/login`; staff accounts land on `/fr/admin`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, run in production |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:seed` | Seed reference data (idempotent: never overwrites your edits) |
| `npm run admin:create` | Create or promote the owner account |
| `npm run backup` | Database dump plus encrypted documents → `./backups` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser end-to-end suite (Playwright) against a running instance |
| `npm run lint` / `typecheck` | Static checks |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, data model, request flows, extension points
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): production deployment (Docker/VPS, Supabase, Vercel), email, payments, WhatsApp, cron, backups
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md): the owner's handbook (in French)
- [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md): security controls, Law 09-08 / GDPR checklist

## Before going live

1. **Verify every destination** against its official source in *Admin → Destinations*, then tick "Mark as verified". Until you do, each page shows a "not yet verified" warning. The seeded content is deliberately generic and contains **no official fees or processing times except general legal framework statements**.
2. Set your **real prices** (*Packages*, *Services*). The seeded prices are placeholders.
3. Complete *Settings*: business identity (ICE, RC, IF, address, CNDP number), WhatsApp number, bank details, admin email.
4. Have the **legal pages** reviewed by a Moroccan legal professional and complete your **CNDP** formalities.
5. Configure a transactional email provider, the cron job and backups (see DEPLOYMENT.md).
