export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export function generateOrderBook(midPrice: number, levels = 12) {
  const tick = midPrice * 0.0006;
  let bidTotal = 0;
  let askTotal = 0;

  const bids: OrderBookLevel[] = Array.from({ length: levels }, (_, i) => {
    const price = midPrice - tick * (i + 1);
    const size = Math.random() * (midPrice > 1000 ? 2 : midPrice > 10 ? 40 : 5000);
    bidTotal += size;
    return { price, size, total: bidTotal };
  });

  const asks: OrderBookLevel[] = Array.from({ length: levels }, (_, i) => {
    const price = midPrice + tick * (i + 1);
    const size = Math.random() * (midPrice > 1000 ? 2 : midPrice > 10 ? 40 : 5000);
    askTotal += size;
    return { price, size, total: askTotal };
  }).reverse();

  return { bids, asks };
}

export interface RecentTrade {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: string;
}

export function generateRecentTrades(midPrice: number, count = 18): RecentTrade[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const drift = (Math.random() - 0.5) * midPrice * 0.001;
    const time = new Date(now - i * 4000);
    return {
      id: `${i}-${time.getTime()}`,
      price: midPrice + drift,
      size: Math.random() * (midPrice > 1000 ? 1.5 : midPrice > 10 ? 30 : 3000),
      side: drift >= 0 ? "buy" : "sell",
      time: time.toLocaleTimeString("en-US", { hour12: false }),
    };
  });
}
