import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/components/settings/settings-view";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Settings — ProfitPulze",
};

export default async function SettingsPage() {
  await verifySession();

  return (
    <div>
      <PageHeader eyebrow="Account" title="Settings" description="Manage your account security." />
      <SettingsView />
    </div>
  );
}
