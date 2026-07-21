import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { WalletView } from "@/components/wallet/wallet-view";
import { verifySession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Wallet — ProfitPulze",
};

export default async function WalletPage() {
  await verifySession();

  return (
    <div>
      <PageHeader eyebrow="Wallet" title="Wallet" description="Manage balances, deposits, and withdrawals." />
      <WalletView />
    </div>
  );
}
