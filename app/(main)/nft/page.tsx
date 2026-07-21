import type { Metadata } from "next";
import { FiImage } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { nftItems } from "@/lib/nft-data";

export const metadata: Metadata = {
  title: "NFT Marketplace — ProfitPulze",
};

export default function NftPage() {
  return (
    <div>
      <PageHeader
        eyebrow="NFT Marketplace"
        title="Discover, collect, and trade NFTs"
        description="Mint, buy, sell, and auction NFTs across supported chains, with on-chain royalties for creators."
        actions={<Button size="lg">Create Collection</Button>}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {nftItems.map((nft) => (
            <Card key={nft.id} className="overflow-hidden">
              <div
                className="flex h-40 items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${nft.color}33, ${nft.color}88)` }}
              >
                <FiImage className="h-10 w-10 text-white/80" />
              </div>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{nft.collection}</p>
                <h3 className="mt-0.5 font-semibold">{nft.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">by {nft.creator}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="font-semibold">{nft.price} {nft.currency}</div>
                  </div>
                  <Button size="sm">Buy Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
