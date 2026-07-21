import { requirePermission } from "@/lib/auth/session";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Users");
  return <>{children}</>;
}
