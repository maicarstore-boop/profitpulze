import "server-only";
import { coins as FALLBACK_COINS, type Coin } from "@/lib/market-data";

const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number | null;
  market_cap: number | null;
  high_24h: number | null;
  low_24h: number | null;
  sparkline_in_7d?: { price: number[] };
}

function hashColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 68%, 50%)`;
}

function downsample(values: number[], points = 24): number[] {
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (clean.length <= points) return clean;
  const step = clean.length / points;
  return Array.from({ length: points }, (_, i) => clean[Math.floor(i * step)]!);
}

/**
 * Fetches live market data from CoinGecko's public API (no key required).
 * Falls back to the small curated list in lib/market-data.ts if the request
 * fails or is rate-limited, so pages never render empty.
 */
export async function fetchMarketCoins(limit = 100): Promise<Coin[]> {
  try {
    const params = new URLSearchParams({
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: String(Math.min(Math.max(limit, 1), 250)),
      page: "1",
      sparkline: "true",
      price_change_percentage: "24h",
    });

    const res = await fetch(`${COINGECKO_URL}?${params.toString()}`, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko responded with ${res.status}`);
    }

    const data = (await res.json()) as CoinGeckoMarket[];
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("CoinGecko returned no coins");
    }

    return data.map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price ?? 0,
      change24h: c.price_change_percentage_24h ?? 0,
      volume24h: c.total_volume ?? 0,
      marketCap: c.market_cap ?? 0,
      sparkline: downsample(c.sparkline_in_7d?.price ?? [c.current_price ?? 0]),
      color: hashColor(c.symbol || c.id),
      high24h: c.high_24h ?? undefined,
      low24h: c.low_24h ?? undefined,
    }));
  } catch (error) {
    console.error("fetchMarketCoins: falling back to curated list —", error);
    return FALLBACK_COINS.slice(0, limit);
  }
}

export async function fetchCoinBySymbol(symbol: string): Promise<Coin | null> {
  const coins = await fetchMarketCoins(250);
  return coins.find((c) => c.symbol === symbol.toUpperCase()) ?? null;
}
