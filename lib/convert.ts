import "server-only";
import { connectToDatabase } from "@/lib/db";
import { fetchCoinBySymbol } from "@/lib/coingecko";
import { adjustBalance, debitBalance, getOrCreateBalance, recordTransaction, InsufficientFundsError } from "@/lib/wallet";
import { creditHolding, debitHolding, InsufficientHoldingError } from "@/lib/holdings";

export class ConvertError extends Error {}

const CASH_SYMBOL = "USDT";

async function priceOf(symbol: string): Promise<number> {
  if (symbol === CASH_SYMBOL) return 1;
  const coin = await fetchCoinBySymbol(symbol);
  if (!coin) throw new ConvertError(`Unknown asset: ${symbol}`);
  return coin.price;
}

/**
 * Converts `fromAmount` of `fromSymbol` into `toSymbol` at the current live
 * rate. USDT is backed by the cash Balance ledger; every other asset is
 * backed by a Holding row. Debit-then-credit, same non-transactional
 * sequential pattern as lib/spot-trading.ts and lib/binary-trading.ts — each
 * individual mutation is atomic, there's just no cross-document rollback if
 * the process dies between the two (matches the rest of this codebase).
 */
export async function executeConvert(userId: string, fromSymbolRaw: string, toSymbolRaw: string, fromAmount: number) {
  await connectToDatabase();

  const from = fromSymbolRaw.toUpperCase();
  const to = toSymbolRaw.toUpperCase();

  if (from === to) throw new ConvertError("Cannot convert an asset to itself.");
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) throw new ConvertError("Enter a valid amount.");

  const [fromPrice, toPrice] = await Promise.all([priceOf(from), priceOf(to)]);
  const usdValue = fromAmount * fromPrice;
  const toAmount = Number((usdValue / toPrice).toFixed(8));

  if (from === CASH_SYMBOL) {
    try {
      await debitBalance(userId, Number(usdValue.toFixed(2)));
    } catch (error) {
      if (error instanceof InsufficientFundsError) throw new ConvertError("Insufficient USDT balance.");
      throw error;
    }
  } else {
    try {
      await debitHolding(userId, from, fromAmount);
    } catch (error) {
      if (error instanceof InsufficientHoldingError) throw new ConvertError(error.message);
      throw error;
    }
  }

  if (to === CASH_SYMBOL) {
    await adjustBalance(userId, Number(usdValue.toFixed(2)));
  } else {
    await creditHolding(userId, to, toAmount);
  }

  const cashDelta = from === CASH_SYMBOL ? -usdValue : to === CASH_SYMBOL ? usdValue : 0;
  const balance = await getOrCreateBalance(userId);
  await recordTransaction({
    userId,
    type: "convert",
    amount: Number(cashDelta.toFixed(2)),
    balanceAfter: balance.available,
    referenceType: "Convert",
    note: `Converted ${fromAmount} ${from} to ${toAmount} ${to}`,
  });

  return { from, to, fromAmount, toAmount };
}
