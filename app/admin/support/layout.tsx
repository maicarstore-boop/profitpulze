import { requirePermission } from "@/lib/auth/session";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Support");
  return <>{children}</>;
}
