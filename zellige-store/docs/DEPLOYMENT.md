# Deployment

## 1. Supabase (database + image storage)

1. Create a project (region close to Morocco, e.g. *West EU (Paris)* or *Central EU (Frankfurt)*).
2. **Database URLs** (*Project Settings → Database → Connection string*):
   - `DATABASE_URL`: **Transaction pooler**, port 6543. On serverless hosts (Vercel) append `?pgbouncer=true&connection_limit=1`.
   - `DIRECT_URL`: **Session pooler** or direct connection, port 5432 (used by `prisma migrate`).
3. **Storage**: *Storage → New bucket* named `products`, set to **Public**. Then set `SUPABASE_URL` (*Project Settings → API → Project URL*) and `SUPABASE_SERVICE_ROLE_KEY` (*service_role* key). This key is used **only on the server**: never expose it in client code.
4. From your machine: `npm run db:migrate && npm run db:seed`.

The app talks to the database only through Prisma on the server; it never uses the Supabase anon key. The `enable_rls` migration turns on row-level security on every table with no policies, so Supabase's public REST API cannot read your tables even if someone has the anon key.

**Authentication** uses the app's own accounts (bcrypt + database sessions) rather than Supabase Auth, so staff roles, guest checkout and order ownership live in one place and the app also runs on any PostgreSQL.

**Backups**: Supabase paid plans include daily backups (*Database → Backups*); point-in-time recovery is an add-on. `npm run backup` also writes a `pg_dump` you can copy elsewhere.

## 2. Hosting

### Vercel
- Import the repository, set **Root Directory** to `zellige-store`.
- Add every variable from `.env.example`. **Supabase Storage is required on Vercel** (its disk is not persistent).
- Build command: `npm run build`. Run `npm run db:migrate` from your machine (or CI) when migrations change.

### Docker / VPS
```bash
docker build -t dar-zellij .
docker run -d -p 3100:3100 --env-file .env -v zellige-uploads:/app/storage --restart unless-stopped dar-zellij
```
Put Nginx or Caddy in front for HTTPS. Without Supabase Storage, uploads stay in the `zellige-uploads` volume: include it in your backups.

## 3. Payments

### CMI (cards in Morocco)
1. Sign a merchant agreement with your bank; CMI sends `CMI_CLIENT_ID` and `CMI_STORE_KEY`.
2. Give CMI your callback URL: `https://your-domain/api/payments/cmi/callback`.
3. Test on `https://testpayment.cmi.co.ma/fim/est3Dgate` (the default `CMI_GATEWAY_URL`), then switch to the production URL CMI gives you.

An order becomes *Paid* only when the callback's hash is valid, the amount matches and `ProcReturnCode` is `00`. The browser return page never confirms a payment by itself. Check the parameter list against the integration kit CMI sends you.

### Stripe (international cards, optional)
Set `STRIPE_SECRET_KEY`, add a webhook to `https://your-domain/api/payments/stripe/webhook` for `checkout.session.completed` and `checkout.session.expired`, then set `STRIPE_WEBHOOK_SECRET`. EUR, USD, GBP, CAD and CHF are charged in that currency; others in MAD.

### Cash on delivery and bank transfer
Enable them in *Settings → Payments*. Bank transfer is offered only once a RIB or IBAN is filled in. COD can be disabled per city.

## 4. Email
Create a [Resend](https://resend.com) account, verify your domain, set `RESEND_API_KEY` and `MAIL_FROM`. The app sends order confirmations (in the customer's language), status and tracking updates, new-order notifications and low-stock alerts.

## 5. Couriers
Each order stores a carrier and tracking number; tracking links are generated for Amana, Aramex, DHL and EMS. To automate shipment creation with a carrier API (Sendit, Cathedis, Amana…), implement the `CourierProvider` interface in `src/lib/couriers.ts`.

## 6. Architecture notes
- `src/app/[locale]/…`: storefront (FR/AR/EN), `src/app/admin/…`: dashboard, `src/app/api/…`: cart quote, checkout, payments, exports, wishlist.
- Prices are integer **centimes of MAD**; other currencies are display conversions stored on each order.
- Every price, stock level, discount and delivery fee is recomputed on the server at checkout. Stock is reserved with conditional updates inside a transaction, so two customers cannot buy the last piece.
- Catalog queries are cached with the tag `catalog`; every admin change revalidates it, so published changes appear immediately.
- Translated fields are JSON `{ "fr", "ar", "en" }` with a French → English → Arabic fallback.
