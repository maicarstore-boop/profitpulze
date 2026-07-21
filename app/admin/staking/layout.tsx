import { requirePermission } from "@/lib/auth/session";

export default async function StakingLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Staking");
  return <>{children}</>;
}
