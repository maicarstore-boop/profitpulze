import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { StakingView } from "@/components/staking/staking-view";

export const metadata: Metadata = {
  title: "Staking — ProfitPulze",
};

export default function StakingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Earn"
        title="Staking"
        description="Earn real rewards on your USDT balance with flexible and locked staking pools."
      />
      <StakingView />
    </div>
  );
}
