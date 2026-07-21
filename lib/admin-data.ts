import { coins } from "@/lib/market-data";

// Module-level mock data must be fully deterministic: it's evaluated once on
// the server (for SSR) and once on the client (for hydration), so Math.random()
// or Date.now() here would produce different output each time and trigger a
// hydration mismatch. A seeded PRNG and a fixed anchor time keep both renders
// identical while still looking "randomly" varied.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const MOCK_NOW = new Date("2026-07-21T09:00:00Z").getTime();

export const revenueTrend = [
  { label: "Mon", value: 182_000 },
  { label: "Tue", value: 201_500 },
  { label: "Wed", value: 176_800 },
  { label: "Thu", value: 224_300 },
  { label: "Fri", value: 259_100 },
  { label: "Sat", value: 213_400 },
  { label: "Sun", value: 241_900 },
];

export const volumeTrend = [
  { label: "Mon", value: 62_400_000 },
  { label: "Tue", value: 71_200_000 },
  { label: "Wed", value: 58_900_000 },
  { label: "Thu", value: 84_600_000 },
  { label: "Fri", value: 96_300_000 },
  { label: "Sat", value: 79_100_000 },
  { label: "Sun", value: 88_450_000 },
];

export const userGrowthTrend = [
  { label: "Week 1", value: 3210 },
  { label: "Week 2", value: 3540 },
  { label: "Week 3", value: 3890 },
  { label: "Week 4", value: 4260 },
  { label: "Week 5", value: 4610 },
  { label: "Week 6", value: 5120 },
];

export const activeSessionsTrend = [
  { label: "00:00", value: 8200 },
  { label: "04:00", value: 5600 },
  { label: "08:00", value: 12400 },
  { label: "12:00", value: 18900 },
  { label: "16:00", value: 21300 },
  { label: "20:00", value: 16700 },
];

export const deviceStats = [
  { label: "Mobile", value: 58, color: "#F0B90B" },
  { label: "Desktop", value: 34, color: "#0ECB81" },
  { label: "Tablet", value: 8, color: "#38BDF8" },
];

export const browserStats = [
  { label: "Chrome", value: 61, color: "#F0B90B" },
  { label: "Safari", value: 22, color: "#0ECB81" },
  { label: "Firefox", value: 9, color: "#38BDF8" },
  { label: "Edge", value: 8, color: "#F6465D" },
];

export const countryStats = [
  { label: "United States", value: 8_420_000 },
  { label: "Nigeria", value: 4_180_000 },
  { label: "Vietnam", value: 3_910_000 },
  { label: "India", value: 3_640_000 },
  { label: "Brazil", value: 2_980_000 },
  { label: "Turkey", value: 2_310_000 },
];

export const walletActivityTrend = [
  { label: "Mon", value: 4200 },
  { label: "Tue", value: 3800 },
  { label: "Wed", value: 5100 },
  { label: "Thu", value: 4700 },
  { label: "Fri", value: 6200 },
  { label: "Sat", value: 5400 },
  { label: "Sun", value: 4900 },
];

export type OrderStatus = "Pending" | "Open" | "Partially Filled" | "Filled" | "Cancelled" | "Rejected" | "Expired";

export interface AdminOrder {
  id: string;
  user: string;
  symbol: string;
  side: "buy" | "sell";
  type: "Market" | "Limit" | "Stop-Limit";
  price: number;
  amount: number;
  filled: number;
  status: OrderStatus;
  pnl: number;
  time: string;
}

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Open", "Partially Filled", "Filled", "Cancelled", "Rejected", "Expired"];
const MOCK_USER_EMAILS = [
  "priya.n@example.com",
  "marco.b@example.com",
  "aiden.c@example.com",
  "sana.i@example.com",
  "diego.f@example.com",
  "elena.v@example.com",
];

export const adminOrders: AdminOrder[] = Array.from({ length: 40 }, (_, i) => {
  const rand = seededRandom(i + 1);
  const coin = coins[i % coins.length]!;
  const status = ORDER_STATUSES[i % ORDER_STATUSES.length]!;
  const amount = Number((rand() * (coin.price > 1000 ? 1.2 : 40)).toFixed(4));
  const filled = status === "Filled" ? amount : status === "Partially Filled" ? amount * 0.4 : 0;
  const side: "buy" | "sell" = i % 2 === 0 ? "buy" : "sell";
  const pnl = (side === "buy" ? 1 : -1) * (rand() - 0.5) * coin.price * amount * 0.02;

  return {
    id: `ORD-${100000 + i}`,
    user: MOCK_USER_EMAILS[i % MOCK_USER_EMAILS.length]!,
    symbol: `${coin.symbol}/USDT`,
    side,
    type: i % 3 === 0 ? "Market" : i % 3 === 1 ? "Limit" : "Stop-Limit",
    price: coin.price * (1 + (rand() - 0.5) * 0.01),
    amount,
    filled,
    status,
    pnl,
    time: new Date(MOCK_NOW - i * 17 * 60_000).toISOString(),
  };
});

export interface AdminWalletTx {
  id: string;
  user: string;
  type: "Deposit" | "Withdrawal" | "Internal Transfer";
  symbol: string;
  amount: number;
  status: "Pending" | "Confirmed" | "Failed";
  confirmations: string;
  network: string;
  time: string;
}

export const adminWalletTxs: AdminWalletTx[] = Array.from({ length: 30 }, (_, i) => {
  const rand = seededRandom(i + 101);
  const coin = coins[i % coins.length]!;
  const type: AdminWalletTx["type"] = i % 3 === 0 ? "Withdrawal" : i % 3 === 1 ? "Deposit" : "Internal Transfer";
  const status: AdminWalletTx["status"] = i % 9 === 0 ? "Failed" : i % 5 === 0 ? "Pending" : "Confirmed";

  return {
    id: `TX-${400000 + i}`,
    user: MOCK_USER_EMAILS[i % MOCK_USER_EMAILS.length]!,
    type,
    symbol: coin.symbol,
    amount: Number((rand() * (coin.price > 1000 ? 0.8 : 30)).toFixed(4)),
    status,
    confirmations: status === "Confirmed" ? `${coin.symbol === "BTC" ? 6 : 32}/${coin.symbol === "BTC" ? 6 : 32}` : `${Math.floor(rand() * 4)}/${coin.symbol === "BTC" ? 6 : 32}`,
    network: coin.symbol === "BTC" ? "Bitcoin" : coin.symbol === "ETH" ? "ERC-20" : `${coin.symbol} Native`,
    time: new Date(MOCK_NOW - i * 23 * 60_000).toISOString(),
  };
});

export interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "Pending" | "Escalated" | "Resolved";
  assignedTo: string;
  updatedAt: string;
}

export const supportTickets: SupportTicket[] = [
  { id: "TKT-8341", user: "priya.n@example.com", subject: "Withdrawal stuck in pending", category: "Wallet", priority: "High", status: "Escalated", assignedTo: "Unassigned", updatedAt: "12 min ago" },
  { id: "TKT-8340", user: "marco.b@example.com", subject: "KYC document rejected, unclear why", category: "KYC", priority: "Medium", status: "Open", assignedTo: "A. Rivera", updatedAt: "38 min ago" },
  { id: "TKT-8339", user: "diego.f@example.com", subject: "2FA reset request", category: "Account", priority: "Urgent", status: "Open", assignedTo: "Unassigned", updatedAt: "1h ago" },
  { id: "TKT-8338", user: "sana.i@example.com", subject: "Order filled at unexpected price", category: "Trading", priority: "Medium", status: "Pending", assignedTo: "J. Okafor", updatedAt: "3h ago" },
  { id: "TKT-8337", user: "aiden.c@example.com", subject: "Referral reward not credited", category: "Referral", priority: "Low", status: "Resolved", assignedTo: "A. Rivera", updatedAt: "1d ago" },
  { id: "TKT-8336", user: "elena.v@example.com", subject: "Suspicious login notification", category: "Security", priority: "Urgent", status: "Escalated", assignedTo: "Unassigned", updatedAt: "1d ago" },
];

export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyVenue: string;
  sellVenue: string;
  spreadPct: number;
  estProfit: number;
  risk: "Low" | "Medium" | "High";
  detectedAt: string;
}

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  { id: "ARB-1", pair: "BTC/USDT", buyVenue: "ProfitPulze", sellVenue: "Kraken", spreadPct: 0.34, estProfit: 210, risk: "Low", detectedAt: "2 min ago" },
  { id: "ARB-2", pair: "ETH/USDT", buyVenue: "Coinbase", sellVenue: "ProfitPulze", spreadPct: 0.51, estProfit: 340, risk: "Medium", detectedAt: "6 min ago" },
  { id: "ARB-3", pair: "SOL/USDT → SOL/USDC → USDT", buyVenue: "Triangular", sellVenue: "ProfitPulze", spreadPct: 0.18, estProfit: 95, risk: "Low", detectedAt: "9 min ago" },
  { id: "ARB-4", pair: "AVAX/USDT", buyVenue: "ProfitPulze", sellVenue: "Uniswap (Arbitrum)", spreadPct: 0.87, estProfit: 480, risk: "High", detectedAt: "14 min ago" },
];

export interface LoginLogEntry {
  id: string;
  user: string;
  ip: string;
  location: string;
  device: string;
  status: "Success" | "Failed";
  time: string;
}

export const loginLogs: LoginLogEntry[] = Array.from({ length: 20 }, (_, i) => {
  const rand = seededRandom(i + 201);
  return {
    id: `LOG-${900000 + i}`,
    user: MOCK_USER_EMAILS[i % MOCK_USER_EMAILS.length]!,
    ip: `${Math.floor(rand() * 223) + 1}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}`,
    location: ["New York, US", "Lagos, NG", "Ho Chi Minh City, VN", "Mumbai, IN", "São Paulo, BR", "Istanbul, TR"][i % 6]!,
    device: ["Chrome on macOS", "Safari on iOS", "Chrome on Android", "Firefox on Windows", "Edge on Windows"][i % 5]!,
    status: i % 11 === 0 ? "Failed" : "Success",
    time: new Date(MOCK_NOW - i * 41 * 60_000).toISOString(),
  };
});
