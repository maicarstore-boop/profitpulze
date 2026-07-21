import type { Metadata } from "next";
import { FiMapPin, FiBriefcase } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers — ProfitPulze",
};

const OPENINGS = [
  { title: "Senior Backend Engineer, Trading Engine", team: "Engineering", location: "Remote", type: "Full-time" },
  { title: "Security Engineer, Detection & Response", team: "Security", location: "Remote", type: "Full-time" },
  { title: "Product Designer, Trading Platform", team: "Design", location: "Lisbon, PT", type: "Full-time" },
  { title: "Compliance Analyst, EMEA", team: "Legal & Compliance", location: "Remote", type: "Full-time" },
  { title: "Site Reliability Engineer", team: "Engineering", location: "Remote", type: "Full-time" },
  { title: "Customer Support Specialist", team: "Support", location: "Singapore", type: "Full-time" },
];

export default function CareersPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Careers"
        title="Help build the future of finance"
        description="We're a remote-first team working on some of the hardest problems in fintech and distributed systems."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {OPENINGS.map((job) => (
            <Card key={job.title} className="transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline">{job.team}</Badge>
                    <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><FiBriefcase className="h-3 w-3" /> {job.type}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">Apply</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
