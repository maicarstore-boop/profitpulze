import { requirePermission } from "@/lib/auth/session";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Settings");
  return <>{children}</>;
}
