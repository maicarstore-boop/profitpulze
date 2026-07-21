import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { coins } from "@/lib/market-data";
import { fetchCoinBySymbol } from "@/lib/coingecko";
import { BinaryTradingView } from "@/components/binary/binary-trading-view";

// Pre-render the most popular pairs at build time; any other valid symbol
// (of the ~250 available from the live feed) still renders on demand.
export function generateStaticParams() {
  return coins.map((coin) => ({ pair: `${coin.symbol}-USDT` }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const symbol = pair.split("-")[0]?.toUpperCase();
  return { title: `${symbol}/USDT Binary Options — ProfitPulze` };
}

export default async function BinaryPairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const symbol = pair.split("-")[0]?.toUpperCase();

  if (!symbol) notFound();

  const coin = await fetchCoinBySymbol(symbol);
  if (!coin) notFound();

  return <BinaryTradingView symbol={coin.symbol} />;
}
