import { requirePermission } from "@/lib/auth/session";

export default async function AuditLogLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Security");
  return <>{children}</>;
}
