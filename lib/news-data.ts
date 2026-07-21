export interface NewsItem {
  slug: string;
  category: string;
  title: string;
  summary: string;
  time: string;
}

export const newsItems: NewsItem[] = [
  {
    slug: "bitcoin-holds-96k",
    category: "Markets",
    title: "Bitcoin holds above $96K as institutional inflows accelerate",
    summary: "Spot ETF inflows post their strongest week in three months amid renewed risk appetite.",
    time: "2h ago",
  },
  {
    slug: "eth-staking-yields",
    category: "Ethereum",
    title: "Ethereum staking yields tick up after latest network upgrade",
    summary: "Validators see improved throughput and lower gas fees following the rollout.",
    time: "5h ago",
  },
  {
    slug: "stablecoin-framework",
    category: "Regulation",
    title: "Regulators outline new framework for stablecoin issuers",
    summary: "Proposed rules would require full reserve backing and monthly attestations.",
    time: "8h ago",
  },
  {
    slug: "solana-pairs-listed",
    category: "Exchange",
    title: "ProfitPulze adds 12 new trading pairs across the Solana ecosystem",
    summary: "New listings expand access to leading DeFi and infrastructure tokens.",
    time: "1d ago",
  },
  {
    slug: "layer2-fees-drop",
    category: "Markets",
    title: "Layer-2 transaction fees drop to new yearly lows",
    summary: "Rollup upgrades across major networks push average fees below $0.01.",
    time: "1d ago",
  },
  {
    slug: "custody-audit",
    category: "Security",
    title: "ProfitPulze publishes Q2 proof-of-reserves audit",
    summary: "Independent auditor confirms 1:1 backing across all major custodied assets.",
    time: "2d ago",
  },
];
