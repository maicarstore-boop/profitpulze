import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin Console — ProfitPulze",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      {children}
    </AdminShell>
  );
}
