import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { P2POffers } from "@/components/p2p/p2p-offers";

export const metadata: Metadata = {
  title: "P2P Trading — ProfitPulze",
};

export default function P2PPage() {
  return (
    <div>
      <PageHeader
        eyebrow="P2P"
        title="Peer-to-peer trading"
        description="Trade directly with verified merchants using your preferred payment method, protected by escrow."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <P2POffers />
      </div>
    </div>
  );
}
