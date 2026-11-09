/**
 * Customer accounts (login, dashboard, online document upload) are OFF by default: customers apply as guests and
 * follow their file with the tracking code (application reference) on /{locale}/track. Documents are sent by
 * WhatsApp and handled by the team in the admin area. Set CUSTOMER_ACCOUNTS=on to bring the customer area back.
 */
export function customerAccountsEnabled() {
  return process.env.CUSTOMER_ACCOUNTS === "on";
}

/** Where a customer follows an application: their dashboard, or the public tracking page with their code. */
export function customerApplicationPath(locale: string, app: { id: string; reference: string }) {
  return customerAccountsEnabled() ? `/${locale}/account/applications/${app.id}` : `/${locale}/track?code=${encodeURIComponent(app.reference)}`;
}
