import { requirePermission } from "@/lib/auth/session";

export default async function RolesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Roles");
  return <>{children}</>;
}
