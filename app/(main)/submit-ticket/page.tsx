import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { TicketForm } from "@/components/support/ticket-form";

export const metadata: Metadata = {
  title: "Submit a Ticket — ProfitPulze",
};

export default function SubmitTicketPage() {
  return (
    <div>
      <PageHeader eyebrow="Support" title="Submit a Ticket" description="Get help from our support team on account, trading, or security issues." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <TicketForm />
      </div>
    </div>
  );
}
