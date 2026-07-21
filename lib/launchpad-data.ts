export interface LaunchpadProject {
  id: string;
  name: string;
  ticker: string;
  tagline: string;
  raiseTarget: number;
  raiseCurrent: number;
  tokenPrice: number;
  status: "live" | "upcoming" | "completed";
  startDate: string;
  color: string;
}

export const launchpadProjects: LaunchpadProject[] = [
  { id: "lp-1", name: "Arcflow Protocol", ticker: "ARC", tagline: "Cross-chain settlement layer for real-world assets", raiseTarget: 8_000_000, raiseCurrent: 5_240_000, tokenPrice: 0.08, status: "live", startDate: "Jul 18, 2026", color: "#7C3AED" },
  { id: "lp-2", name: "Lumen Compute", ticker: "LUM", tagline: "Decentralized GPU marketplace for AI workloads", raiseTarget: 12_000_000, raiseCurrent: 12_000_000, tokenPrice: 0.15, status: "completed", startDate: "Jun 02, 2026", color: "#F59E0B" },
  { id: "lp-3", name: "Verdant Finance", ticker: "VRD", tagline: "Tokenized carbon credit trading infrastructure", raiseTarget: 5_000_000, raiseCurrent: 0, tokenPrice: 0.05, status: "upcoming", startDate: "Aug 04, 2026", color: "#22C55E" },
  { id: "lp-4", name: "Horizon Chain", ticker: "HZN", tagline: "High-throughput L1 optimized for gaming", raiseTarget: 15_000_000, raiseCurrent: 0, tokenPrice: 0.12, status: "upcoming", startDate: "Aug 21, 2026", color: "#38BDF8" },
];
