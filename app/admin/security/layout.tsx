import { requirePermission } from "@/lib/auth/session";

export default async function SecurityLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Security");
  return <>{children}</>;
}
