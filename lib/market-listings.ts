import "server-only";
import { connectToDatabase } from "@/lib/db";
import { MarketListingModel } from "@/models/MarketListing";

/** Symbols an admin has delisted — filtered out of discovery (/api/markets) and blocked from new trades. */
export async function getDelistedSymbols(): Promise<Set<string>> {
  await connectToDatabase();
  const rows = await MarketListingModel.find({ delisted: true }).select("symbol").lean();
  return new Set(rows.map((r) => r.symbol));
}

export async function isSymbolDelisted(symbol: string): Promise<boolean> {
  await connectToDatabase();
  const row = await MarketListingModel.findOne({ symbol: symbol.toUpperCase(), delisted: true }).lean();
  return !!row;
}
