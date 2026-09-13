// Curated list of coin+network combinations this platform accepts. NOWPayments encodes the
// network directly into the currency ticker (e.g. "usdttrc20"), so there is no separate
// network parameter to pass — `ticker` below is exactly what's sent as pay_currency/currency.
export interface SupportedCurrency {
  ticker: string;
  symbol: string;
  name: string;
  network: string;
  /** Regex family used by lib/payments/address-validation.ts to format-check a destination address. */
  addressFamily: "btc" | "evm" | "trc20" | "solana";
}

// USDT (TRC20) is listed first — it's the default/primary deposit asset (lowest network fees,
// most commonly held stablecoin), and DepositPanel pre-selects whichever currency is first here.
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { ticker: "usdttrc20", symbol: "USDT", name: "Tether", network: "TRC20", addressFamily: "trc20" },
  { ticker: "usdterc20", symbol: "USDT", name: "Tether", network: "ERC20", addressFamily: "evm" },
  { ticker: "usdtbsc", symbol: "USDT", name: "Tether", network: "BEP20", addressFamily: "evm" },
  { ticker: "usdc", symbol: "USDC", name: "USD Coin", network: "ERC20", addressFamily: "evm" },
  { ticker: "btc", symbol: "BTC", name: "Bitcoin", network: "Bitcoin", addressFamily: "btc" },
  { ticker: "eth", symbol: "ETH", name: "Ethereum", network: "ERC20", addressFamily: "evm" },
  { ticker: "bnbbsc", symbol: "BNB", name: "BNB", network: "BEP20", addressFamily: "evm" },
  { ticker: "sol", symbol: "SOL", name: "Solana", network: "Solana", addressFamily: "solana" },
  { ticker: "trx", symbol: "TRX", name: "TRON", network: "TRC20", addressFamily: "trc20" },
];

export function findSupportedCurrency(ticker: string): SupportedCurrency | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.ticker === ticker.toLowerCase());
}
