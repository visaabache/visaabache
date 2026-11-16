# Dar Zellij: Moroccan zellige e-commerce

A multilingual online boutique (Français · العربية RTL · English) for zellige-inspired ceramics, home decor and gifts, built for the Moroccan market and ready to sell internationally. It includes a full admin dashboard that needs no programming knowledge.

> The brand name **Dar Zellij** is a working name: change it in *Admin → Settings → Shop name*.

## What's included

| Area | Highlights |
|---|---|
| **Storefront** | Homepage (hero, perks, shop by category, featured collections, bestsellers, craftsmanship story, new arrivals, gifts, testimonials, photo gallery, newsletter), shop with search and filters (category, price, colour, pattern, stock, sort), category, collection and gift pages, product pages (zoomable gallery with lightbox and swipe, variants, stock status, specs, materials and care, *how it is made*, reviews, related products), cart and slide-out cart, wishlist, guest checkout, order confirmation and tracking, customer accounts with order history, legal pages |
| **Languages** | FR / AR / EN everywhere: interface, products, categories, collections, pages, emails. Full RTL layout and Arabic fonts. Language switcher keeps the current page. hreflang and per-language canonical URLs |
| **Morocco** | MAD by default, cash on delivery, CMI card payment (hosted page, signed hash, server-to-server confirmation), bank transfer with RIB shown after ordering, delivery fee per city, free delivery threshold, phone-first checkout |
| **International** | Country selection, delivery zones (base fee + per kg, free-over, delivery estimates), display currencies (EUR, USD, GBP…), Stripe Checkout for cards outside Morocco |
| **Admin** (`/admin`) | Dashboard (revenue, orders to process, 14-day chart, low stock, incomplete products, setup checklist), products (FR/AR/EN fields side by side, multiple photos with reordering, variants with their own SKU/stock/price, colours, patterns, dimensions, craft labelling, SEO, draft → preview → publish, duplicate, archive), Excel/CSV import and export, inventory with low-stock alerts, unlimited nested categories, collections (homepage, gifts, scheduled promotions), orders (status, payment, carrier and tracking, notes, customer emails, stock restored on cancel), customers, discount codes, delivery (cities and zones), reviews moderation, testimonials, pages editor, newsletter export, settings, currencies, team |
| **SEO** | Server-rendered pages, per-page metadata, Open Graph, `Product` / `AggregateOffer` / `BreadcrumbList` / `Store` structured data, multilingual sitemap, robots rules, optimised AVIF/WebP images |
| **Security** | bcrypt passwords, HMAC-hashed DB sessions, staff/owner roles, rate-limited logins and forms, same-origin checks, server-side price and stock validation, atomic stock reservation, signed payment callbacks, security headers, RLS enabled on Supabase, formula-safe spreadsheet exports, audit log |

## Honest product labelling

Every product has a **How it is made** setting:

- *Zellige-inspired design* or *Artisan-inspired design*: the page explicitly says it makes **no handmade claim**.
- *Made by artisans* or *Handmade (verified)*: the admin **must** write a craft note (who made it, where, how it was verified), and the form refuses to save without one.

The 12 starter products, built from your photos, are printed designs and use *Zellige-inspired design*. Testimonials are never invented: the homepage section only appears once you publish real ones.

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Supabase) · Supabase Storage (or local disk) · sharp · ExcelJS · Resend (email) · CMI · Stripe.

## Quick start

```bash
cd zellige-store
cp .env.example .env          # fill DATABASE_URL, DIRECT_URL, SESSION_SECRET, SEED_ADMIN_*
npm install
npm run db:migrate            # create tables
npm run db:seed               # categories, 12 products, collections, cities, zones, currencies, pages, owner account
npm run dev                   # http://localhost:3100  ·  admin: http://localhost:3100/admin
```

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve (port 3100) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed starter content (idempotent, never overwrites your edits) |
| `npm run admin:create -- you@mail.ma "Name"` | Create or reset an owner account |
| `npm run backup` | `pg_dump` + local uploads → `./backups` |
| `npm test` | Unit tests (pricing, discounts, CMI/Stripe signatures, CSV, money) |
| `npm run lint` / `typecheck` | Static checks |

## Before going live

1. **Prices, stock, dimensions and weights**: the seeded values are placeholders (dimensions and weights are left empty; the dashboard lists incomplete products).
2. **Delivery fees** per city and international zones (*Admin → Delivery*): the seeded fees are examples.
3. **Exchange rates** (*Settings → Currencies*): approximate, update them regularly.
4. **Settings**: phone, email, WhatsApp, address, legal name, ICE, RIB/IBAN, social links.
5. **Legal pages**: templates referring to Law 31-08 (consumer protection, 7-day withdrawal) and Law 09-08 (personal data); have them reviewed and complete your CNDP declaration.
6. **Payments**: CMI merchant credentials (test on the CMI test platform first), optionally Stripe.
7. **Email**: a Resend key and a verified sending domain, otherwise emails are only logged.
8. **Product photos**: the starter photos were taken in-store; replace them with studio shots when you can.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Supabase, Vercel and Docker, and [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) for day-to-day use (in French).
