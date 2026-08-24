import "server-only";
import { connectToDatabase } from "@/lib/db";
import { HoldingModel } from "@/models/Holding";

export class InsufficientHoldingError extends Error {}

export async function getUserHoldings(userId: string) {
  await connectToDatabase();
  const rows = await HoldingModel.find({ userId, quantity: { $gt: 0 } }).lean();
  return rows.map((h) => ({ symbol: h.symbol, quantity: h.quantity }));
}

export async function getHoldingQuantity(userId: string, symbol: string): Promise<number> {
  await connectToDatabase();
  const row = await HoldingModel.findOne({ userId, symbol: symbol.toUpperCase() }).lean();
  return row?.quantity ?? 0;
}

/** Atomically credits quantity to a holding, creating the row on first credit. */
export async function creditHolding(userId: string, symbol: string, amount: number) {
  await connectToDatabase();
  const rounded = Number(amount.toFixed(8));
  const updated = await HoldingModel.findOneAndUpdate(
    { userId, symbol: symbol.toUpperCase() },
    { $inc: { quantity: rounded } },
    { new: true, upsert: true }
  );
  return updated;
}

/**
 * Debits quantity atomically, guarded by `quantity >= amount` in the same
 * query as the decrement — mirrors debitBalance in lib/wallet.ts so
 * concurrent sells/converts can never drive a holding negative.
 */
export async function debitHolding(userId: string, symbol: string, amount: number) {
  await connectToDatabase();
  const rounded = Number(amount.toFixed(8));
  const updated = await HoldingModel.findOneAndUpdate(
    { userId, symbol: symbol.toUpperCase(), quantity: { $gte: rounded } },
    { $inc: { quantity: -rounded } },
    { new: true }
  );
  if (!updated) throw new InsufficientHoldingError(`Insufficient ${symbol.toUpperCase()} balance.`);
  return updated;
}
