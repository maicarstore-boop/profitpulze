import type { Metadata } from "next";
import { FiArrowUp } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { topTraders } from "@/lib/traders-data";

export const metadata: Metadata = {
  title: "Copy Trading — ProfitPulze",
};

export default function CopyTradingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Copy Trading"
        title="Follow the leaderboard, copy the strategy"
        description="Automatically mirror trades from top-performing traders, with configurable risk controls and drawdown limits."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Trader</th>
                <th className="px-4 py-3 font-medium">30d ROI</th>
                <th className="px-4 py-3 font-medium">Win Rate</th>
                <th className="px-4 py-3 font-medium">Followers</th>
                <th className="px-4 py-3 font-medium">AUM</th>
                <th className="px-4 py-3 font-medium">Max Drawdown</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {topTraders.map((trader, i) => (
                <tr key={trader.id} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3 font-medium text-muted-foreground">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: trader.color }}
                      >
                        {trader.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <div className="font-medium">{trader.name}</div>
                        <div className="text-xs text-muted-foreground">{trader.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-success">
                    <span className="flex items-center gap-0.5">
                      <FiArrowUp className="h-3 w-3" />
                      {trader.roi30d}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{trader.winRate}%</td>
                  <td className="px-4 py-3 text-muted-foreground">{trader.followers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">${(trader.aum / 1_000_000).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-danger">-{trader.maxDrawdown}%</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm">Copy</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Set your risk limits", description: "Cap allocation per trader and set a maximum drawdown before auto-stop." },
            { title: "Choose a copy mode", description: "Mirror by fixed amount or proportional to the trader's position sizing." },
            { title: "Track performance", description: "Real-time PnL, win rate, and profit-sharing breakdowns for every trader you follow." },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
