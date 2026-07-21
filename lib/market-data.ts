export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
  color: string;
  /** Real CoinGecko 24h high/low — only populated on the live-fetched path, not the curated fallback list. */
  high24h?: number;
  low24h?: number;
}

const seed: Omit<Coin, "sparkline">[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 96842.31, change24h: 2.14, volume24h: 38_200_000_000, marketCap: 1_912_000_000_000, color: "#F7931A" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3684.55, change24h: 3.42, volume24h: 21_400_000_000, marketCap: 443_000_000_000, color: "#627EEA" },
  { id: "solana", symbol: "SOL", name: "Solana", price: 214.87, change24h: -1.87, volume24h: 5_600_000_000, marketCap: 102_000_000_000, color: "#14F195" },
  { id: "bnb", symbol: "BNB", name: "BNB", price: 682.19, change24h: 0.94, volume24h: 1_900_000_000, marketCap: 99_000_000_000, color: "#F0B90B" },
  { id: "xrp", symbol: "XRP", name: "XRP", price: 2.41, change24h: -0.62, volume24h: 3_100_000_000, marketCap: 138_000_000_000, color: "#00AAE4" },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.874, change24h: 1.28, volume24h: 810_000_000, marketCap: 31_000_000_000, color: "#0033AD" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.3812, change24h: 5.61, volume24h: 2_300_000_000, marketCap: 56_000_000_000, color: "#C2A633" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", price: 0.00002187, change24h: -2.94, volume24h: 480_000_000, marketCap: 12_900_000_000, color: "#FFA409" },
  { id: "avalanche", symbol: "AVAX", name: "Avalanche", price: 41.63, change24h: 4.05, volume24h: 720_000_000, marketCap: 17_100_000_000, color: "#E84142" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 6.92, change24h: -0.35, volume24h: 290_000_000, marketCap: 10_500_000_000, color: "#E6007A" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 24.78, change24h: 2.67, volume24h: 640_000_000, marketCap: 16_800_000_000, color: "#2A5ADA" },
  { id: "toncoin", symbol: "TON", name: "Toncoin", price: 5.84, change24h: 1.02, volume24h: 210_000_000, marketCap: 14_600_000_000, color: "#0098EA" },
];

// Deterministic flat sparkline so server- and client-rendered markup match on
// first paint; `useLiveMarket` replaces this with real jitter after mount.
export const coins: Coin[] = seed.map((c) => ({
  ...c,
  sparkline: Array.from({ length: 24 }, () => c.price),
}));

export function formatPrice(value: number): string {
  if (value >= 1) {
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

export function topGainers(list: Coin[], count = 5): Coin[] {
  return [...list].sort((a, b) => b.change24h - a.change24h).slice(0, count);
}

export function topLosers(list: Coin[], count = 5): Coin[] {
  return [...list].sort((a, b) => a.change24h - b.change24h).slice(0, count);
}

export function trending(list: Coin[], count = 5): Coin[] {
  return [...list].sort((a, b) => b.volume24h - a.volume24h).slice(0, count);
}
