import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReferralLinkCard } from "@/components/referral/referral-link-card";

export const metadata: Metadata = {
  title: "Referral Program — ProfitPulze",
};

const STEPS = [
  { title: "Share your link", description: "Send your unique referral link or code to friends and followers." },
  { title: "They sign up & trade", description: "Your referral creates an account and completes their first trade." },
  { title: "You both earn", description: "Receive up to 20% commission on their trading fees, forever." },
];

export default function ReferralPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Referral Program"
        title="Invite friends, earn together"
        description="Earn a lifetime commission on the trading fees of everyone you refer."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <ReferralLinkCard />

          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <Card key={step.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
