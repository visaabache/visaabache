# Security & compliance

## Security controls implemented

| Area | Control | Where |
|---|---|---|
| Transport | HTTPS + HSTS (preload) and `upgrade-insecure-requests` when `APP_URL` is https | `next.config.ts` |
| Headers | CSP (no third-party scripts except GA after consent), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP | `next.config.ts` |
| Passwords | bcrypt (cost 12), minimum 10 chars with letters and digits, constant-time path for unknown emails | `lib/auth/password.ts` |
| Sessions | 256-bit random token in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie; only an HMAC-SHA256 of the token is stored; 14 days for customers, 12 h for staff; revoked on password change or deactivation | `lib/auth/session.ts` |
| Authorisation | RBAC permissions checked server-side in every admin page and Server Action; customers can only reach their own records (queries are always scoped by `userId`) | `lib/auth/permissions.ts` |
| CSRF | Server Actions enforce same-origin (Next.js); state-changing API routes are signature- (CMI) or secret- (cron) protected | |
| Input validation | zod schemas and server-side whitelists for every enum; markdown sanitised (`sanitize-html`); emails rendered with escaped text | `lib/validation.ts`, `lib/markdown.ts` |
| Uploads | Type detected from magic bytes (PDF, JPEG, PNG, WEBP only), size limit, random storage keys, served with `Content-Disposition`, `nosniff` and a sandbox CSP | `lib/storage/index.ts`, `api/documents` |
| Documents at rest | AES-256-GCM per file (random IV, auth tag) before writing to disk or S3; SHA-256 checksum kept | `lib/storage/crypto.ts` |
| Brute force | PostgreSQL-backed rate limits on login, registration, password reset, uploads, inquiries, tracking, discount checks | `lib/rate-limit.ts` |
| Open redirects | `next` parameter restricted to local paths | `safeNext()` |
| Payments | Never shown as successful without a verified CMI callback (hash, order id, amount, return code) or an audited manual confirmation | `api/payments/cmi/callback`, `lib/domain/payments.ts` |
| Spam | Honeypot field + rate limit on public forms | `actions/public.ts` |
| Traceability | Audit log for logins, document access by staff, exports, status changes, payments, refunds, settings, roles | `lib/audit.ts` |

## Law 09-08 (Morocco) / GDPR checklist

| Requirement | How the platform supports it | Owner action |
|---|---|---|
| Prior formalities with the CNDP | CNDP number shown in footer and invoices once entered | **File the declaration / authorisation** (identity documents and possible transfers abroad) |
| Information of data subjects | Privacy policy, cookie policy, notices on forms | Review texts with a legal professional |
| Consent | Explicit, unbundled checkboxes (terms, processing of identity documents, WhatsApp, marketing) stored in `ConsentRecord` with version, time and IP | — |
| Data minimisation | Only fields needed for the assistance are collected; optional fields are optional | Avoid collecting extra documents |
| Retention | Configurable archiving, document deletion, draft deletion and optional anonymisation, applied automatically | Set periods in *Settings → Retention* |
| Rights (access, rectification, opposition, deletion) | Self-service JSON export, profile editing, deletion request workflow, anonymisation tool | Answer requests promptly |
| Security | See table above | Keep secrets safe, enable 2FA on hosting/email accounts |
| Processors | Hosting, storage, email and payment providers | Sign processing agreements (DPA) with each provider |
| Transfers outside Morocco | Choose hosting regions | Declare or obtain authorisation from the CNDP |
| Breach handling | Audit log + notification log help the investigation | Have an incident procedure (who, what, when to notify) |

## Business-model safeguards

- Independent-business disclaimer on the homepage, destination pages, footer, wizard (mandatory consent), emails and invoices.
- "No guarantee of approval" stated in the wizard, FAQ, terms and destination pages.
- Official fees are kept in separate fields and labelled as government fees; Visa Abache fees are labelled as assistance fees.
- Destination information shows a "not yet verified" warning until the owner verifies it, and always links to the official sources.
- The platform never submits applications to government websites and never sells appointments.
- Testimonials can only be published if they are verified **and** the client consented; customer-written reviews cannot be edited by the admin.

## Operational recommendations

1. Rotate `SESSION_SECRET` if you suspect a leak (this logs everyone out). **Never** rotate `DOCUMENT_ENCRYPTION_KEY` without re-encrypting the files.
2. Restrict database access to the application servers (Supabase network restrictions or a firewall).
3. Keep dependencies updated (`npm audit`, `npm outdated`) and redeploy monthly.
4. Back up daily, copy off-site, and test a restore every quarter.
