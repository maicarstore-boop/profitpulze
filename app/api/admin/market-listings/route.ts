import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { fetchMarketCoins } from "@/lib/coingecko";
import { MarketListingModel } from "@/models/MarketListing";
import { BinaryTradeModel } from "@/models/BinaryTrade";

export async function GET(request: Request) {
  await requirePermission("Markets");
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 250);

  const [coins, listings, activity] = await Promise.all([
    fetchMarketCoins(limit),
    MarketListingModel.find().lean(),
    BinaryTradeModel.aggregate([
      {
        $group: {
          _id: "$symbol",
          openCount: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          settledCount: { $sum: { $cond: [{ $eq: ["$status", "settled"] }, 1, 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
          totalStaked: { $sum: "$stake" },
        },
      },
    ]),
  ]);

  const delistedSet = new Set(listings.filter((l) => l.delisted).map((l) => l.symbol));
  const reasonBySymbol = new Map(listings.map((l) => [l.symbol, l.reason]));
  const activityBySymbol = new Map(activity.map((a) => [a._id, a]));

  return NextResponse.json({
    pairs: coins.map((coin) => {
      const stats = activityBySymbol.get(coin.symbol);
      const winRate = stats && stats.settledCount > 0 ? Number(((stats.wins / stats.settledCount) * 100).toFixed(1)) : 0;
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        color: coin.color,
        price: coin.price,
        change24h: coin.change24h,
        marketCap: coin.marketCap,
        delisted: delistedSet.has(coin.symbol),
        delistReason: reasonBySymbol.get(coin.symbol) ?? "",
        tradingActivity: {
          openTrades: stats?.openCount ?? 0,
          settledTrades: stats?.settledCount ?? 0,
          totalStaked: stats?.totalStaked ?? 0,
          winRate,
        },
      };
    }),
  });
}
