import { requirePermission } from "@/lib/auth/session";

export default async function WalletsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Wallets");
  return <>{children}</>;
}
