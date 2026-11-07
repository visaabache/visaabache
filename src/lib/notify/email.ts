import "server-only";

export type EmailMessage = { to: string; subject: string; text: string; html: string };

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; error?: string }> {
  const driver = process.env.EMAIL_DRIVER || "console";
  const from = process.env.EMAIL_FROM || "VISA ABACHE <no-reply@visaabache.ma>";
  try {
    if (driver === "smtp") {
      // Resolved at runtime only (not bundled): SMTP needs raw TCP sockets, unavailable on Cloudflare Workers — use EMAIL_DRIVER=resend there.
      const mod = process.env.NODEMAILER_MODULE || "nodemailer";
      const nodemailer: typeof import("nodemailer") = await import(/* webpackIgnore: true */ mod);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
      await transport.sendMail({ from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
      return { ok: true };
    }
    if (driver === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
      });
      if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
      return { ok: true };
    }
    // console driver (development)
    console.info(`\n[email] to=${msg.to}\n[email] subject=${msg.subject}\n${msg.text}\n`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Branded, table-based email layout (works in Gmail/Outlook). Body text is escaped; URLs become links. */
export function renderEmailHtml(opts: { subject: string; text: string; locale: string; footer: string; cta?: { label: string; url: string } }) {
  const rtl = opts.locale === "ar";
  const logoUrl = `${(process.env.APP_URL || "").replace(/\/$/, "")}/brand/visa-abache-logo-email.png`;
  const paragraphs = escapeHtml(opts.text)
    .split(/\n{2,}/)
    .map((p) =>
      `<p style="margin:0 0 14px;line-height:1.6">${p
        .replace(/\n/g, "<br>")
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#102747;font-weight:600">$1</a>')}</p>`,
    )
    .join("");
  const cta = opts.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(opts.cta.url)}" style="background:#C9A45C;color:#102747;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${escapeHtml(opts.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="${opts.locale}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(opts.subject)}</title></head>
<body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#102747;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px"><img src="${logoUrl}" width="200" height="47" alt="VISA ABACHE" style="display:block;border:0;height:auto;max-width:200px"></td></tr>
<tr><td style="padding:28px;font-size:15px;text-align:${rtl ? "right" : "left"}">${paragraphs}${cta}</td></tr>
<tr><td style="padding:18px 28px;background:#fbf7ef;color:#6b7280;font-size:12px;line-height:1.5;text-align:${rtl ? "right" : "left"}">${escapeHtml(opts.footer)}</td></tr>
</table></td></tr></table></body></html>`;
}
