import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { launchpadProjects } from "@/lib/launchpad-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Launchpad — ProfitPulze",
};

const STATUS_VARIANT = {
  live: "success",
  upcoming: "outline",
  completed: "default",
} as const;

export default function LaunchpadPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Launchpad"
        title="Discover and back new projects early"
        description="Participate in token sales with transparent allocation, subscription, and lottery-based distribution."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {launchpadProjects.map((project) => {
            const pct = Math.min((project.raiseCurrent / project.raiseTarget) * 100, 100);
            return (
              <Card key={project.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.ticker.slice(0, 2)}
                    </span>
                    <Badge variant={STATUS_VARIANT[project.status]} className="capitalize">
                      {project.status}
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-semibold">{project.name}</h3>
                  <p className="text-xs text-muted-foreground">{project.ticker}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{project.tagline}</p>

                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", project.status === "completed" ? "bg-muted-foreground" : "bg-primary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>${(project.raiseCurrent / 1_000_000).toFixed(2)}M raised</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Token Price</span>
                    <span className="font-medium text-foreground">${project.tokenPrice}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Start Date</span>
                    <span className="font-medium text-foreground">{project.startDate}</span>
                  </div>

                  <Button
                    variant={project.status === "live" ? "primary" : "outline"}
                    size="sm"
                    className="mt-4 w-full"
                    disabled={project.status === "completed"}
                  >
                    {project.status === "live"
                      ? "Subscribe Now"
                      : project.status === "upcoming"
                        ? "Notify Me"
                        : "Sale Ended"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
