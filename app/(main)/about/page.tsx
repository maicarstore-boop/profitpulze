import type { Metadata } from "next";
import { FiGlobe, FiUsers, FiShield, FiTrendingUp } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us — ProfitPulze",
};

const STATS = [
  { label: "Founded", value: "2019" },
  { label: "Employees", value: "1,200+" },
  { label: "Countries Served", value: "160+" },
  { label: "Registered Users", value: "42M+" },
];

const VALUES = [
  { icon: FiShield, title: "Security First", description: "Every decision starts with the question: does this protect user funds and data?" },
  { icon: FiUsers, title: "User-Obsessed", description: "We build for traders of every experience level, from first-time buyers to institutions." },
  { icon: FiGlobe, title: "Globally Compliant", description: "We work with regulators across our markets to operate transparently and responsibly." },
  { icon: FiTrendingUp, title: "Relentless Iteration", description: "Markets move fast — so do we. Continuous shipping, continuous learning." },
];

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Company"
        title="Building the infrastructure for the on-chain economy"
        description="ProfitPulze is a global cryptocurrency exchange committed to secure, accessible, and transparent trading for everyone."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 text-lg font-semibold">Our Values</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="flex items-start gap-4 pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
