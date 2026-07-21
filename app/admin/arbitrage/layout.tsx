import { requirePermission } from "@/lib/auth/session";

export default async function ArbitrageLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Arbitrage");
  return <>{children}</>;
}
