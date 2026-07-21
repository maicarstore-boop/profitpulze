import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/market-data";
import { fetchMarketCoins } from "@/lib/coingecko";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { title: "Up to 10x leverage", description: "Amplify your position size on major pairs with isolated or cross margin." },
  { title: "Real-time risk engine", description: "Live margin ratio and liquidation price so you always know your exposure." },
  { title: "Competitive borrow rates", description: "Hourly interest accrual with transparent, published borrow APRs." },
];

export const metadata: Metadata = {
  title: "Margin Trading — ProfitPulze",
};

export default async function MarginPage() {
  const coins = await fetchMarketCoins(20);

  return (
    <div>
      <PageHeader
        eyebrow="Margin Trading"
        title="Trade with leverage, manage your risk"
        description="Borrow against your portfolio to open larger positions on spot pairs, with isolated and cross margin modes."
        actions={
          <Link href="/trade/BTC-USDT">
            <Button size="lg">Open Margin Trade</Button>
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.title}>
              <CardContent className="pt-6">
                <h3 className="font-semibold">{h.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{h.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Margin Pairs</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Pair</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">24h Change</th>
                  <th className="px-4 py-3 font-medium">Max Leverage</th>
                  <th className="px-4 py-3 font-medium">Borrow APR</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coins.slice(0, 8).map((coin, i) => {
                  const positive = coin.change24h >= 0;
                  return (
                    <tr key={coin.id} className="border-b border-border last:border-0 hover:bg-accent">
                      <td className="px-4 py-3 font-medium">{coin.symbol}/USDT</td>
                      <td className="px-4 py-3">${formatPrice(coin.price)}</td>
                      <td className={cn("px-4 py-3 font-medium", positive ? "text-success" : "text-danger")}>
                        <span className="flex items-center gap-0.5">
                          {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
                          {Math.abs(coin.change24h).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{5 + (i % 3) * 2}x</td>
                      <td className="px-4 py-3 text-muted-foreground">{(3.2 + i * 0.4).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/trade/${coin.symbol}-USDT`}>
                          <Button size="sm" variant="outline">Trade</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
