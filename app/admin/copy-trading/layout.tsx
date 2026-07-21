import { requirePermission } from "@/lib/auth/session";

export default async function CopyTradingLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Copy Trading");
  return <>{children}</>;
}
