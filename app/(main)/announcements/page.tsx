import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { newsItems } from "@/lib/news-data";

export const metadata: Metadata = {
  title: "Announcements — ProfitPulze",
};

const ANNOUNCEMENTS = [
  ...newsItems.filter((n) => n.category === "Exchange" || n.category === "Security"),
  {
    slug: "maintenance-window",
    category: "Maintenance",
    title: "Scheduled system maintenance — August 3, 02:00–04:00 UTC",
    summary: "Trading, deposits, and withdrawals will be briefly unavailable during the maintenance window.",
    time: "3d ago",
  },
  {
    slug: "new-fiat-rails",
    category: "Product",
    title: "New fiat on-ramp rails now live for EUR and GBP",
    summary: "Faster settlement times for SEPA and Faster Payments deposits.",
    time: "5d ago",
  },
];

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeader eyebrow="Company" title="Announcements" description="Product updates, listings, and platform notices." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="divide-y divide-border rounded-2xl border border-border">
          {ANNOUNCEMENTS.map((item) => (
            <div key={item.slug} className="px-5 py-5">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{item.category}</Badge>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
