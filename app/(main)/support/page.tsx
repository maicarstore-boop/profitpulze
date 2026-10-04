import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SupportInbox } from "@/components/support/support-inbox";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Support Messages — ProfitPulze",
};

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await verifySession();
  const { c } = await searchParams;

  return (
    <div>
      <PageHeader eyebrow="Support" title="Messages" description="Chat directly with our support team about your account, deposits, withdrawals, or trading." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SupportInbox key={c ?? "inbox"} initialConversationId={c} />
      </div>
    </div>
  );
}
