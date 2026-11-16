import "server-only";

/**
 * Transactional email through Resend's HTTP API (RESEND_API_KEY, MAIL_FROM).
 * Without a key, messages are logged so that development and first deployments work without email.
 */
export async function sendMail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Dar Zellij <onboarding@resend.dev>";
  if (!key || !to) {
    console.info(`[mail:not-sent] to=${to || "(none)"} subject="${subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) console.error(`[mail] ${res.status} ${await res.text()}`);
    return res.ok;
  } catch (e) {
    console.error("[mail] failed", e);
    return false;
  }
}
