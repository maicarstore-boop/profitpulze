import "server-only";
import { connectToDatabase } from "@/lib/db";
import { fetchCoinBySymbol } from "@/lib/coingecko";
import { adjustBalance, debitBalance, recordTransaction, InsufficientFundsError } from "@/lib/wallet";
import { creditHolding, debitHolding, InsufficientHoldingError } from "@/lib/holdings";

export class SpotTradeError extends Error {}

export interface ExecuteSpotOrderInput {
  userId: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
}

/**
 * Executes a spot Buy/Sell immediately at the current live price — there is no
 * order book/matching engine, so every order fills at market. Buy debits USDT
 * and credits the asset holding; Sell does the reverse. Both the balance and
 * holding mutations are individually atomic ($inc guarded by a sufficiency
 * check), the same pattern lib/binary-trading.ts uses for stakes/payouts.
 */
export async function executeSpotOrder(input: ExecuteSpotOrderInput) {
  await connectToDatabase();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new SpotTradeError("Enter a valid amount.");
  }

  const coin = await fetchCoinBySymbol(input.symbol);
  if (!coin) throw new SpotTradeError("Unknown trading pair.");

  const total = Number((input.amount * coin.price).toFixed(2));

  if (input.side === "buy") {
    let balance;
    try {
      balance = await debitBalance(input.userId, total);
    } catch (error) {
      if (error instanceof InsufficientFundsError) throw new SpotTradeError("Insufficient USDT balance.");
      throw error;
    }
    await creditHolding(input.userId, coin.symbol, input.amount);
    await recordTransaction({
      userId: input.userId,
      type: "spot_buy",
      amount: -total,
      balanceAfter: balance.available,
      referenceType: "SpotOrder",
      note: `Bought ${input.amount} ${coin.symbol} at $${coin.price}`,
    });
  } else {
    try {
      await debitHolding(input.userId, coin.symbol, input.amount);
    } catch (error) {
      if (error instanceof InsufficientHoldingError) throw new SpotTradeError(error.message);
      throw error;
    }
    const balance = await adjustBalance(input.userId, total);
    await recordTransaction({
      userId: input.userId,
      type: "spot_sell",
      amount: total,
      balanceAfter: balance.available,
      referenceType: "SpotOrder",
      note: `Sold ${input.amount} ${coin.symbol} at $${coin.price}`,
    });
  }

  return { symbol: coin.symbol, side: input.side, price: coin.price, amount: input.amount, total };
}
