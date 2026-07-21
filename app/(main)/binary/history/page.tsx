import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BinaryHistoryView } from "@/components/binary/binary-history-view";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Binary Trading History — ProfitPulze",
};

export default async function BinaryHistoryPage() {
  await verifySession();

  return (
    <div>
      <PageHeader
        eyebrow="Binary Options"
        title="Trading History"
        description="Your win/loss record, P/L summary, and transaction history."
      />
      <BinaryHistoryView />
    </div>
  );
}
