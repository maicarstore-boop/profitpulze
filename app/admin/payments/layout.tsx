import { requirePermission } from "@/lib/auth/session";

export default async function PaymentsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Payments");
  return <>{children}</>;
}
