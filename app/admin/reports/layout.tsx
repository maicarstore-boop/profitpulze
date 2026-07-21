import { requirePermission } from "@/lib/auth/session";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Reports");
  return <>{children}</>;
}
