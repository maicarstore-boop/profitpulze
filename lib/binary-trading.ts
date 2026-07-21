import "server-only";
import { connectToDatabase } from "@/lib/db";
import { fetchCoinBySymbol } from "@/lib/coingecko";
import { BinaryTradeModel, type ContractStyle, type TradeDirection, type TradeResult } from "@/models/BinaryTrade";
import { UserBalanceModel, DEMO_STARTING_BALANCE } from "@/models/UserBalance";
import { TransactionModel, type TransactionType } from "@/models/Transaction";
import { MarketPriceSnapshotModel } from "@/models/MarketPriceSnapshot";
import { UserModel } from "@/models/User";
import { isSymbolDelisted } from "@/lib/market-listings";
import { isMaintenanceMode } from "@/lib/platform-settings";

export const PAYOUT_RATE = 0.85;
export const MIN_STAKE = 5;
export const MAX_STAKE = 5000;
export const MIN_DURATION_SECONDS = 30;
export const MAX_DURATION_SECONDS = 24 * 60 * 60;

export class TradeError extends Error {}

export async function getOrCreateBalance(userId: string) {
  await connectToDatabase();
  let balance = await UserBalanceModel.findOne({ userId });
  if (!balance) {
    balance = await UserBalanceModel.create({ userId, available: DEMO_STARTING_BALANCE });
  }
  return balance;
}

/**
 * Atomically credits/debits a user's balance via $inc rather than a
 * read-modify-write (`balance.available = x; await balance.save()`), which
 * has a lost-update race under concurrent calls: two operations that both
 * read the same starting value will silently clobber one another, with the
 * second save() winning and the first credit/debit vanishing even though
 * both wrote a Transaction ledger entry claiming it happened. $inc lets
 * MongoDB serialize the increment itself, so concurrent calls always sum
 * correctly regardless of ordering.
 */
export async function adjustBalance(userId: string, delta: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId); // ensures the doc exists (seeded with the demo starting balance) before the $inc below
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId },
    { $inc: { available: Number(delta.toFixed(2)) } },
    { new: true }
  );
  if (!updated) throw new Error(`Failed to adjust balance for user ${userId}`);
  return updated;
}

export class InsufficientFundsError extends Error {}

/**
 * Debits a positive amount atomically, guarded by `available: {$gte: amount}`
 * in the same query as the decrement — so the sufficiency check and the
 * debit are one indivisible operation. Checking balance.available first and
 * debiting after (two separate steps) would let two concurrent debits both
 * pass the check against a stale read and jointly overdraw the account.
 */
export async function debitBalance(userId: string, amount: number) {
  await connectToDatabase();
  await getOrCreateBalance(userId);
  const updated = await UserBalanceModel.findOneAndUpdate(
    { userId, available: { $gte: amount } },
    { $inc: { available: -Number(amount.toFixed(2)) } },
    { new: true }
  );
  if (!updated) throw new InsufficientFundsError("Insufficient balance.");
  return updated;
}

export async function recordTransaction(input: {
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}) {
  await TransactionModel.create(input);
}

export interface OpenTradeInput {
  userId: string;
  symbol: string;
  contractStyle: ContractStyle;
  direction: TradeDirection;
  stake: number;
  durationSeconds: number;
}

export async function openTrade(input: OpenTradeInput) {
  await connectToDatabase();

  if (await isMaintenanceMode()) {
    throw new TradeError("Trading is temporarily disabled for maintenance. Please try again shortly.");
  }

  if (input.stake < MIN_STAKE || input.stake > MAX_STAKE) {
    throw new TradeError(`Stake must be between $${MIN_STAKE} and $${MAX_STAKE}.`);
  }
  if (input.durationSeconds < MIN_DURATION_SECONDS || input.durationSeconds > MAX_DURATION_SECONDS) {
    throw new TradeError("Invalid trade duration.");
  }

  const user = await UserModel.findById(input.userId).lean();
  if (!user) throw new TradeError("User not found.");
  if (user.status !== "active") throw new TradeError("Your account is not active.");
  if (user.tradingSuspended) throw new TradeError("Trading privileges are currently suspended on this account.");

  const coin = await fetchCoinBySymbol(input.symbol);
  if (!coin) throw new TradeError("Unknown trading pair.");

  if (await isSymbolDelisted(coin.symbol)) {
    throw new TradeError(`${coin.symbol} is currently delisted and not available for new trades.`);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.durationSeconds * 1000);
  const potentialPayout = Number((input.stake * (1 + PAYOUT_RATE)).toFixed(2));

  let balance;
  try {
    balance = await debitBalance(input.userId, input.stake);
  } catch (error) {
    if (error instanceof InsufficientFundsError) throw new TradeError("Insufficient balance.");
    throw error;
  }

  const trade = await BinaryTradeModel.create({
    userId: input.userId,
    symbol: coin.symbol,
    contractStyle: input.contractStyle,
    direction: input.direction,
    entryPrice: coin.price,
    stake: input.stake,
    payoutRate: PAYOUT_RATE,
    potentialPayout,
    durationSeconds: input.durationSeconds,
    openedAt: now,
    expiresAt,
    status: "open",
    priceSource: "coingecko",
  });

  await MarketPriceSnapshotModel.create({
    symbol: coin.symbol,
    price: coin.price,
    source: "coingecko",
    context: "entry",
    tradeId: trade._id.toString(),
    recordedAt: now,
  });

  await recordTransaction({
    userId: input.userId,
    type: "trade_stake",
    amount: -input.stake,
    balanceAfter: balance.available,
    referenceType: "BinaryTrade",
    referenceId: trade._id.toString(),
    note: `Opened ${coin.symbol} ${input.direction} trade`,
  });

  return trade;
}

function computeSettlement(direction: TradeDirection, entryPrice: number, exitPrice: number, stake: number, payoutRate: number) {
  if (exitPrice === entryPrice) {
    return { result: "draw" as TradeResult, profitLoss: 0 };
  }
  const priceWentUp = exitPrice > entryPrice;
  const won = (direction === "up") === priceWentUp;
  if (won) {
    return { result: "win" as TradeResult, profitLoss: Number((stake * payoutRate).toFixed(2)) };
  }
  return { result: "lose" as TradeResult, profitLoss: -stake };
}

/**
 * Settles a single trade against a given exit price. Uses an atomic
 * findOneAndUpdate keyed on status:"open" so concurrent settlement sweeps
 * can never double-settle (or alter) the same trade — this is also what
 * makes a settled trade's result structurally immutable: no other code path
 * writes to result/exitPrice/profitLoss.
 */
async function settleTradeById(tradeId: string, exitPrice: number, now: Date) {
  const trade = await BinaryTradeModel.findById(tradeId).lean();
  if (!trade || trade.status !== "open") return null;

  const { result, profitLoss } = computeSettlement(trade.direction, trade.entryPrice, exitPrice, trade.stake, trade.payoutRate);

  const updated = await BinaryTradeModel.findOneAndUpdate(
    { _id: tradeId, status: "open" },
    { $set: { status: "settled", exitPrice, result, profitLoss } },
    { new: true }
  );

  if (!updated) return null; // already settled by a concurrent sweep

  await MarketPriceSnapshotModel.create({
    symbol: updated.symbol,
    price: exitPrice,
    source: "coingecko",
    context: "exit",
    tradeId,
    recordedAt: now,
  });

  if (result === "win" || result === "draw") {
    const creditAmount = result === "win" ? updated.stake + profitLoss : updated.stake;
    const balance = await adjustBalance(updated.userId, creditAmount);
    await recordTransaction({
      userId: updated.userId,
      type: "trade_payout",
      amount: creditAmount,
      balanceAfter: balance.available,
      referenceType: "BinaryTrade",
      referenceId: tradeId,
      note: `${result === "win" ? "Win" : "Draw"} payout for ${updated.symbol} trade`,
    });
  }

  return updated;
}

/** Finds every open trade whose expiry has passed and settles it against the current market price. */
export async function settleDueTrades(): Promise<number> {
  await connectToDatabase();
  const now = new Date();
  const due = await BinaryTradeModel.find({ status: "open", expiresAt: { $lte: now } }).lean();
  if (due.length === 0) return 0;

  const symbols = [...new Set(due.map((t) => t.symbol))];
  const priceMap = new Map<string, number>();
  await Promise.all(
    symbols.map(async (symbol) => {
      const coin = await fetchCoinBySymbol(symbol);
      if (coin) priceMap.set(symbol, coin.price);
    })
  );

  let settledCount = 0;
  for (const trade of due) {
    const exitPrice = priceMap.get(trade.symbol);
    if (exitPrice === undefined) continue; // price fetch failed; retried on the next sweep
    const settled = await settleTradeById(trade._id.toString(), exitPrice, now);
    if (settled) settledCount++;
  }
  return settledCount;
}

/** Admin-only: refunds the stake and cancels a trade. Only ever possible while status is "open". */
export async function cancelTrade(tradeId: string, reason: string) {
  await connectToDatabase();

  const updated = await BinaryTradeModel.findOneAndUpdate(
    { _id: tradeId, status: "open" },
    { $set: { status: "cancelled", cancelReason: reason } },
    { new: true }
  );
  if (!updated) throw new TradeError("Only open (unsettled) trades can be cancelled.");

  const balance = await adjustBalance(updated.userId, updated.stake);

  await recordTransaction({
    userId: updated.userId,
    type: "trade_refund",
    amount: updated.stake,
    balanceAfter: balance.available,
    referenceType: "BinaryTrade",
    referenceId: tradeId,
    note: `Trade cancelled by admin: ${reason}`,
  });

  return updated;
}

interface TradeStatsBucket {
  totalTrades: number;
  wins: number;
  losses: number;
  draws: number;
  netProfitLoss: number;
  totalStaked: number;
  winRate: number;
}

async function aggregateStats(userId: string, since: Date): Promise<TradeStatsBucket> {
  const [row] = await BinaryTradeModel.aggregate([
    { $match: { userId, status: "settled", updatedAt: { $gte: since } } },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        wins: { $sum: { $cond: [{ $eq: ["$result", "win"] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ["$result", "lose"] }, 1, 0] } },
        draws: { $sum: { $cond: [{ $eq: ["$result", "draw"] }, 1, 0] } },
        netProfitLoss: { $sum: "$profitLoss" },
        totalStaked: { $sum: "$stake" },
      },
    },
  ]);

  const base = row ?? { totalTrades: 0, wins: 0, losses: 0, draws: 0, netProfitLoss: 0, totalStaked: 0 };
  const winRate = base.totalTrades > 0 ? Number(((base.wins / base.totalTrades) * 100).toFixed(1)) : 0;
  return { ...base, winRate };
}

export async function getUserTradeStats(userId: string) {
  await connectToDatabase();
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [daily, weekly, monthly, allTime] = await Promise.all([
    aggregateStats(userId, startOfDay),
    aggregateStats(userId, startOfWeek),
    aggregateStats(userId, startOfMonth),
    aggregateStats(userId, new Date(0)),
  ]);

  return { daily, weekly, monthly, allTime };
}
