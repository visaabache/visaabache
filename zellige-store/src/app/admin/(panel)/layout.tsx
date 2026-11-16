import { requireAdmin } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { navCounts } from "@/lib/admin-queries";
import { adminLogout } from "@/actions/account";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [settings, counts] = await Promise.all([getSettings(), navCounts()]);
  return (
    <div>
      <AdminNav storeName={settings.store.name} user={{ name: user.name, role: user.role }} counts={counts} logout={adminLogout} />
      <main className="px-4 py-6 lg:ms-60 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
