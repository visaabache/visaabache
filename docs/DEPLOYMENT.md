# Deployment guide

## 1. Choose a hosting model

| Option | Best for | Notes |
|---|---|---|
| **A. Docker on a VPS** (recommended) | Simplest operations, persistent disk, no upload limits | `docker-compose.yml` runs the app, PostgreSQL and an hourly cron. Put Caddy or Nginx in front for HTTPS. |
| **B. Node host + Supabase** (Render, Railway, Fly.io…) | Managed database and backups | Use Supabase Postgres (`DATABASE_URL` = pooled, `DIRECT_URL` = direct) and Supabase Storage via S3 (`STORAGE_DRIVER=s3`). |
| **C. Vercel + Supabase** | Serverless | `STORAGE_DRIVER=s3` is **required** (no persistent disk). Request bodies are limited to ~4.5 MB, so set `UPLOAD_MAX_MB=4`. `vercel.json` schedules the cron hourly (Pro plan; Hobby allows daily only). |

Data-protection note (Law 09-08): if the database or files are hosted outside Morocco, declare the cross-border transfer to the CNDP. Choose an EU region (for example Paris, `eu-west-3`) for adequacy.

## 2. Environment variables

Copy `.env.example` to `.env` and fill it in. The required values are:

| Variable | How to generate / where to find |
|---|---|
| `APP_URL` | Public URL, e.g. `https://www.visaabache.ma` (HTTPS enables HSTS and upgrade-insecure-requests) |
| `DATABASE_URL`, `DIRECT_URL` | Postgres connection strings |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `DOCUMENT_ENCRYPTION_KEY` | `openssl rand -base64 32`. **Store it safely. Losing it makes documents unreadable. Never change it after go-live.** |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `EMAIL_DRIVER` + SMTP/Resend values | See §5 |

## 3A. Docker / VPS

```bash
git clone <repo> visa-abache && cd visa-abache
cp .env.example .env && nano .env          # set POSTGRES_PASSWORD, secrets, APP_URL, email…
docker compose up -d --build                # migrations run automatically on start
docker compose exec app npm run db:seed     # first install only (creates owner from SEED_ADMIN_*)
```

HTTPS with Caddy (`/etc/caddy/Caddyfile`):

```
www.visaabache.ma {
  reverse_proxy 127.0.0.1:3000
}
visaabache.ma {
  redir https://www.visaabache.ma{uri}
}
```

To update: `git pull && docker compose up -d --build`.

## 3B/3C. Supabase + Node host or Vercel

1. Create a Supabase project in an EU region. In **Settings → Database**, copy the *pooled* URL (port 6543, append `?pgbouncer=true`) to `DATABASE_URL` and the *direct* URL (port 5432) to `DIRECT_URL`.
2. In **Storage**, create a **private** bucket `visa-abache-documents`. In **Settings → Storage → S3 access**, create keys and set:
   ```
   STORAGE_DRIVER=s3
   S3_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
   S3_REGION=<project region>
   S3_BUCKET=visa-abache-documents
   S3_ACCESS_KEY_ID=…  S3_SECRET_ACCESS_KEY=…
   S3_FORCE_PATH_STYLE=true
   ```
   Files are encrypted by the application before upload, so the bucket only ever holds ciphertext.
3. Set the build command to `npm run vercel-build` (or `npx prisma migrate deploy && npm run build`) and the start command to `npm start`.
4. Run `npm run db:seed` once from your machine with the production `DATABASE_URL`.

## 3D. Cloudflare Workers + Neon (current test deployment)

Live test URL: **https://app.visa-abache.workers.dev**. Worker `app`, Cloudflare account *Flyabroadevisa*; database: Neon project `visa-abache` (Frankfurt).

| Piece | How it is set up |
|---|---|
| Adapter | `@opennextjs/cloudflare` (`open-next.config.ts`), worker entry `cf-worker.ts`, config `wrangler.jsonc` |
| Database | Neon Postgres through the Neon serverless driver (`DB_DRIVER=neon`); one Prisma client per request (`src/lib/db.ts`) |
| Documents | `STORAGE_DRIVER=db`: AES-256-GCM ciphertext stored in the `StoredFile` table (no R2 needed). Switch to R2 (`STORAGE_DRIVER=s3` + R2 S3 keys) once volumes grow |
| Static files | Served from the Workers KV namespace `visa-abache-static-assets`, uploaded by `scripts/cf-upload-assets.mjs` |
| Automations | Cron Trigger `0 * * * *` in `wrangler.jsonc` → `/api/cron/run` |
| Secrets | `DATABASE_URL`, `SESSION_SECRET`, `DOCUMENT_ENCRYPTION_KEY`, `CRON_SECRET` (set with `wrangler secret`) |
| Email | `EMAIL_DRIVER=console` (emails only appear in the worker logs). SMTP is not possible on Workers: use Resend (`EMAIL_DRIVER=resend` + `RESEND_API_KEY` secret) |

**Plan requirement:** the Workers **Free** plan allows 10 ms of CPU per request; server-rendered pages need 10–25 ms, so a share of requests fail with error 1102. Use **Workers Paid** ($5/month). No code change is needed after upgrading.

Deploy updates:

```bash
export CLOUDFLARE_ACCOUNT_ID=81ab4316522f206e49bd94884d21b968 CLOUDFLARE_API_TOKEN=<token>
npm run cf:deploy                 # build → upload static files to KV → wrangler deploy
DATABASE_URL=<neon url> node scripts/neon-migrate.mjs   # when new migrations exist
```

Custom domain later: Cloudflare dashboard → Workers & Pages → `app` → Settings → Domains & Routes → *Add custom domain*. Then update `APP_URL` in `wrangler.jsonc` and redeploy.

## 4. Scheduled automation (cron)

Call this every hour:

```
GET https://<APP_URL>/api/cron/run
Authorization: Bearer <CRON_SECRET>
```

- **Docker:** already handled by the `cron` service.
- **Vercel:** `vercel.json` (Vercel sends the `CRON_SECRET` header automatically).
- **Other hosts:** use the platform scheduler, a crontab (`0 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/run`) or an external pinger such as cron-job.org.

## 5. Email

| Provider | Settings |
|---|---|
| Resend | `EMAIL_DRIVER=resend`, `RESEND_API_KEY`, verify your domain |
| SMTP (Brevo, Mailjet, Zoho, OVH, Google Workspace…) | `EMAIL_DRIVER=smtp`, `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD` |

Set `EMAIL_FROM` to an address on your verified domain and configure **SPF, DKIM and DMARC** DNS records. The `console` driver (the default) only prints emails to the server log.

## 6. Payments

- **Bank transfer and cash** work out of the box. Add your bank details in *Admin → Settings → Payments*.
- **Bank card (CMI):** after merchant onboarding with your bank, CMI provides a *client id*, a *store key* and the test and production gateway URLs. Set `CMI_CLIENT_ID`, `CMI_STORE_KEY` and `CMI_GATEWAY_URL`, then enable "Card payments" in settings. Give CMI the callback URL `https://<APP_URL>/api/payments/cmi/callback`. **Validate the full flow on the CMI test platform** against the integration kit your bank supplies; parameter names can differ between kit versions. Payments are only confirmed by the verified server callback.

## 7. WhatsApp

- **Click-to-chat** (no account needed): set the number in *Admin → Settings → WhatsApp*. Every page, service and application then gets pre-filled messages, and the admin gets one-click customer messages and reminders.
- **Automatic notifications (optional):** create a WhatsApp Business Platform (Cloud API) app in Meta Business, then set `WHATSAPP_CLOUD_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. For messages outside the 24-hour window, get a template approved (one body variable `{{1}}`) and set `WHATSAPP_TEMPLATE_NAME` and `WHATSAPP_TEMPLATE_LANG`. Then enable "automatic WhatsApp notifications" in settings. Only customers who opted in receive them.

## 8. Analytics & Search Console

- Google Analytics 4: paste the `G-XXXX` id in *Settings → SEO*. It loads **only after cookie consent**.
- Search Console: paste the HTML-tag verification code in *Settings → SEO*, then submit `https://<APP_URL>/sitemap.xml`.

## 9. Backups & recovery

- **Supabase:** daily backups are included; enable Point-in-Time Recovery on paid plans. Enable versioning or replication on the storage bucket if available.
- **Docker / VPS:** schedule `npm run backup` (for example `docker compose exec app npm run backup` nightly). Each run writes a `pg_dump` plus the encrypted storage folder to `./backups` and keeps 30 days. **Copy the archives off-site** (another provider, encrypted).
- **Restore:** `pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" db.dump`, then copy `storage/` back. You also need the same `DOCUMENT_ENCRYPTION_KEY`.
- **Test a restore every quarter.**

## 10. Go-live checklist

- [ ] HTTPS working; `APP_URL` starts with `https://`
- [ ] Secrets generated; `DOCUMENT_ENCRYPTION_KEY` stored in a password manager
- [ ] `npm run db:seed` executed; owner password changed after first login
- [ ] Settings complete (identity, WhatsApp, bank, admin email); setup checklist on the dashboard is all green
- [ ] Destinations verified against official sources; prices set
- [ ] Legal pages reviewed; CNDP declaration filed and its number entered in settings
- [ ] Email deliverability tested (welcome email, password reset)
- [ ] Cron running (*Admin → Automation* shows hourly CRON runs)
- [ ] Backups scheduled and one restore tested
- [ ] `npm run test:e2e` passes against staging (`BASE_URL=… ADMIN_PASSWORD=…`)
