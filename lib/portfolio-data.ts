export interface Holding {
  symbol: string;
  quantity: number;
}

export const holdings: Holding[] = [
  { symbol: "BTC", quantity: 0.842 },
  { symbol: "ETH", quantity: 6.15 },
  { symbol: "SOL", quantity: 38.2 },
  { symbol: "BNB", quantity: 4.6 },
  { symbol: "XRP", quantity: 1200 },
];

export interface ActivityItem {
  id: string;
  type: "Buy" | "Sell" | "Deposit" | "Withdraw" | "Stake";
  asset: string;
  amount: string;
  time: string;
  status: "Completed" | "Pending";
}

export const recentActivity: ActivityItem[] = [
  { id: "a-1", type: "Buy", asset: "BTC", amount: "0.05 BTC", time: "12 min ago", status: "Completed" },
  { id: "a-2", type: "Stake", asset: "ETH", amount: "2.0 ETH", time: "3h ago", status: "Completed" },
  { id: "a-3", type: "Deposit", asset: "USDT", amount: "5,000 USDT", time: "1d ago", status: "Completed" },
  { id: "a-4", type: "Sell", asset: "SOL", amount: "12.4 SOL", time: "2d ago", status: "Completed" },
  { id: "a-5", type: "Withdraw", asset: "BTC", amount: "0.1 BTC", time: "4d ago", status: "Pending" },
];
