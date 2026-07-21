import { requirePermission } from "@/lib/auth/session";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("CMS");
  return <>{children}</>;
}
