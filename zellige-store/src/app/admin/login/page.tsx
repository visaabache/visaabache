import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth/session";
import { StarMark } from "@/components/ui/Zellige";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Sign in" };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <StarMark className="h-12 w-12" />
          <h1 className="font-display text-3xl font-semibold">Store admin</h1>
          <p className="text-sm text-charcoal-500">Staff accounts only.</p>
        </div>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
