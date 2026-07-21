import { NextResponse } from "next/server";
import { fetchMarketCoins } from "@/lib/coingecko";
import { getDelistedSymbols } from "@/lib/market-listings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 250);

  const [allCoins, delisted] = await Promise.all([fetchMarketCoins(limit + delistedBuffer), getDelistedSymbols()]);
  const coins = allCoins.filter((c) => !delisted.has(c.symbol)).slice(0, limit);

  return NextResponse.json({ coins });
}

// Over-fetch a little so filtering out delisted symbols doesn't shrink the page below `limit`.
const delistedBuffer = 20;
