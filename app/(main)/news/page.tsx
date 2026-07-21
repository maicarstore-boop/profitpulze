import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { NewsList } from "@/components/news/news-list";

export const metadata: Metadata = {
  title: "News — ProfitPulze",
};

export default function NewsPage() {
  return (
    <div>
      <PageHeader eyebrow="News" title="Latest News" description="Market-moving headlines, curated in real time." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <NewsList />
      </div>
    </div>
  );
}
