import { requirePermission } from "@/lib/auth/session";

export default async function TradingLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Trading");
  return <>{children}</>;
}
