import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { MarketsTable } from "@/components/markets/markets-table";

export const metadata: Metadata = {
  title: "Markets — ProfitPulze",
};

export default function MarketsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Markets"
        title="All Markets"
        description="Real-time prices across every asset listed on ProfitPulze."
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MarketsTable />
      </div>
    </div>
  );
}
