import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { connectToDatabase } from "@/lib/db";
import { LegalPageModel } from "@/models/LegalPage";

export const metadata: Metadata = {
  title: "Legal & Privacy — ProfitPulze",
};

// Revalidate periodically so CMS edits to legal content go live without a full redeploy.
export const revalidate = 60;

function Prose({ content, updatedAt }: { content: string; updatedAt?: Date }) {
  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground">
      {updatedAt && <p>Last updated: {updatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>}
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

async function getLegalPages() {
  await connectToDatabase();
  const pages = await LegalPageModel.find().lean();
  return new Map(pages.map((p) => [p.slug, p]));
}

export default async function LegalPage() {
  const pages = await getLegalPages();
  const terms = pages.get("terms");
  const privacy = pages.get("privacy");
  const risk = pages.get("risk");

  return (
    <div>
      <PageHeader eyebrow="Legal" title="Legal & Privacy" description="Terms, privacy practices, and risk disclosures." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs
          items={[
            { key: "terms", label: "Terms of Service", content: terms ? <Prose content={terms.content} updatedAt={terms.updatedAt} /> : null },
            { key: "privacy", label: "Privacy Policy", content: privacy ? <Prose content={privacy.content} updatedAt={privacy.updatedAt} /> : null },
            { key: "risk", label: "Risk Disclosure", content: risk ? <Prose content={risk.content} updatedAt={risk.updatedAt} /> : null },
          ]}
        />
      </div>
    </div>
  );
}
