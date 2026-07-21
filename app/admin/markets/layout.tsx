import { requirePermission } from "@/lib/auth/session";

export default async function MarketsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Markets");
  return <>{children}</>;
}
