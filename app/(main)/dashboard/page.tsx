import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard — ProfitPulze",
};

export default async function DashboardPage() {
  await verifySession();

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Dashboard" description="Your portfolio at a glance." />
      <DashboardView />
    </div>
  );
}
