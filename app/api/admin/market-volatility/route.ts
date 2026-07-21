import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { fetchMarketCoins } from "@/lib/coingecko";

/**
 * This platform has exactly one live price source (CoinGecko) — real cross-venue
 * arbitrage (buy low on venue A, sell high on venue B) can't be detected without a
 * second independent price feed, so we don't fabricate one. What IS real: each pair's
 * actual 24h high/low spread from CoinGecko, which is a genuine volatility signal and
 * the closest honest analogue to "opportunity scanning" available with this data source.
 */
export async function GET(request: Request) {
  await requirePermission("Trading");

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 250);

  const coins = await fetchMarketCoins(limit);

  const withSpread = coins
    .filter((c) => c.high24h !== undefined && c.low24h !== undefined && c.low24h > 0)
    .map((c) => ({
      symbol: c.symbol,
      name: c.name,
      price: c.price,
      high24h: c.high24h!,
      low24h: c.low24h!,
      spreadPct: Number((((c.high24h! - c.low24h!) / c.low24h!) * 100).toFixed(2)),
      volume24h: c.volume24h,
    }))
    .sort((a, b) => b.spreadPct - a.spreadPct);

  const avgSpread = withSpread.length > 0 ? withSpread.reduce((s, c) => s + c.spreadPct, 0) / withSpread.length : 0;

  return NextResponse.json({
    pairs: withSpread,
    avgSpreadPct: Number(avgSpread.toFixed(2)),
  });
}
