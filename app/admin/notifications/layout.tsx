import { requirePermission } from "@/lib/auth/session";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Notifications");
  return <>{children}</>;
}
