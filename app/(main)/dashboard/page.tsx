import type { Metadata } from "next";
import Link from "next/link";
import { FiSettings } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard — ProfitPulze",
};

export default async function DashboardPage() {
  await verifySession();

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Your portfolio at a glance."
        actions={
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <FiSettings className="h-3.5 w-3.5" /> Settings
            </Button>
          </Link>
        }
      />
      <DashboardView />
    </div>
  );
}
