import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/market-data";
import { fetchMarketCoins } from "@/lib/coingecko";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Futures — ProfitPulze",
};

export default async function FuturesPage() {
  const coins = await fetchMarketCoins(40);

  return (
    <div>
      <PageHeader
        eyebrow="Derivatives"
        title="Perpetual Futures"
        description="USDT-margined perpetual contracts with up to 125x leverage on major markets."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Contract</th>
                <th className="px-4 py-3 font-medium">Mark Price</th>
                <th className="px-4 py-3 font-medium">24h Change</th>
                <th className="px-4 py-3 font-medium">Funding Rate</th>
                <th className="px-4 py-3 font-medium">Max Leverage</th>
                <th className="px-4 py-3 font-medium">Open Interest</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, i) => {
                const positive = coin.change24h >= 0;
                const funding = (((i * 7) % 20) - 10) / 100;
                return (
                  <tr key={coin.id} className="border-b border-border last:border-0 hover:bg-accent">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{coin.symbol}-PERP</span>
                        <Badge variant="outline">USDT-M</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">${formatPrice(coin.price)}</td>
                    <td className={cn("px-4 py-3 font-medium", positive ? "text-success" : "text-danger")}>
                      <span className="flex items-center gap-0.5">
                        {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
                        {Math.abs(coin.change24h).toFixed(2)}%
                      </span>
                    </td>
                    <td className={cn("px-4 py-3", funding >= 0 ? "text-success" : "text-danger")}>
                      {funding >= 0 ? "+" : ""}
                      {funding.toFixed(3)}%
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{25 + (i % 5) * 20}x</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      ${(coin.volume24h / 3_000_000).toFixed(1)}M
                    </td>
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

        <p className="mt-4 text-xs text-muted-foreground">
          Perpetual futures carry high risk due to leverage and can result in losses exceeding your
          initial margin. Funding rates and mark prices shown are illustrative.
        </p>
      </div>
    </div>
  );
}
