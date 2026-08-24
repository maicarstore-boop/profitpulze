import type { SupportedCurrency } from "@/lib/payments/supported-currencies";

// Format-only validation (correct charset/length/prefix for the network) — this does not
// verify checksums or that the address actually exists on-chain.
const PATTERNS: Record<SupportedCurrency["addressFamily"], RegExp> = {
  btc: /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  evm: /^0x[a-fA-F0-9]{40}$/,
  trc20: /^T[a-zA-Z0-9]{33}$/,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};

export function isValidAddress(address: string, family: SupportedCurrency["addressFamily"]): boolean {
  return PATTERNS[family].test(address.trim());
}
