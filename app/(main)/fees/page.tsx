import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Fees — ProfitPulze",
};

const SPOT_TIERS = [
  { tier: "Regular User", volume: "< $50,000", maker: "0.100%", taker: "0.100%" },
  { tier: "VIP 1", volume: "≥ $50,000", maker: "0.090%", taker: "0.100%" },
  { tier: "VIP 2", volume: "≥ $250,000", maker: "0.080%", taker: "0.090%" },
  { tier: "VIP 3", volume: "≥ $1,000,000", maker: "0.070%", taker: "0.080%" },
  { tier: "VIP 4", volume: "≥ $5,000,000", maker: "0.050%", taker: "0.070%" },
];

const OTHER_FEES = [
  { label: "Futures Maker / Taker", value: "0.020% / 0.050%" },
  { label: "Margin Interest (base)", value: "From 3.20% APR" },
  { label: "Instant Buy/Sell (Convert)", value: "0.50%" },
  { label: "Fiat Card Purchase", value: "1.50%" },
  { label: "P2P Trading", value: "0% (merchant may vary)" },
];

export default function FeesPage() {
  return (
    <div>
      <PageHeader eyebrow="Pricing" title="Fees" description="Transparent, volume-based pricing across every product." />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold">Spot Trading Fee Schedule</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">30d Volume</th>
                <th className="px-4 py-3 font-medium">Maker Fee</th>
                <th className="px-4 py-3 font-medium">Taker Fee</th>
              </tr>
            </thead>
            <tbody>
              {SPOT_TIERS.map((tier) => (
                <tr key={tier.tier} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{tier.tier}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tier.volume}</td>
                  <td className="px-4 py-3">{tier.maker}</td>
                  <td className="px-4 py-3">{tier.taker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-lg font-semibold">Other Fees</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {OTHER_FEES.map((fee) => (
            <div key={fee.label} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{fee.label}</span>
              <span className="font-medium">{fee.value}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Fees are calculated on a rolling 30-day trading volume basis and may vary by asset and
          payment method. Network fees for withdrawals are set dynamically based on blockchain
          conditions.
        </p>
      </div>
    </div>
  );
}
