export interface Trader {
  id: string;
  name: string;
  handle: string;
  roi30d: number;
  winRate: number;
  followers: number;
  aum: number;
  maxDrawdown: number;
  color: string;
}

export const topTraders: Trader[] = [
  { id: "t-1", name: "Elena Voss", handle: "@elenavoss", roi30d: 42.8, winRate: 71, followers: 12400, aum: 3_200_000, maxDrawdown: 8.4, color: "#7C3AED" },
  { id: "t-2", name: "Marcus Reyes", handle: "@mreyes_fx", roi30d: 31.2, winRate: 66, followers: 8760, aum: 1_940_000, maxDrawdown: 11.2, color: "#F59E0B" },
  { id: "t-3", name: "Sana Ibrahim", handle: "@sanatrades", roi30d: 27.6, winRate: 69, followers: 6420, aum: 1_480_000, maxDrawdown: 6.9, color: "#22C55E" },
  { id: "t-4", name: "Diego Fontana", handle: "@dfontana", roi30d: 19.4, winRate: 61, followers: 4110, aum: 890_000, maxDrawdown: 14.8, color: "#38BDF8" },
  { id: "t-5", name: "Priya Menon", handle: "@priyam", roi30d: 15.9, winRate: 64, followers: 3025, aum: 610_000, maxDrawdown: 9.1, color: "#F472B6" },
];
