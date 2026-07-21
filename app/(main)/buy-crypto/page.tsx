import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BuyCryptoForm } from "@/components/buy-crypto/buy-crypto-form";

export const metadata: Metadata = {
  title: "Buy Crypto — ProfitPulze",
};

export default function BuyCryptoPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Buy Crypto"
        title="Buy crypto with card or bank transfer"
        description="Instant purchases with transparent fees — funds land in your ProfitPulze wallet."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <BuyCryptoForm />
      </div>
    </div>
  );
}
