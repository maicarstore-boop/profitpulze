import Link from "next/link";
import { FiLock, FiUnlock } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PRODUCTS = [
  { asset: "USDT", type: "Flexible", apy: "6.2%", lock: "No lock-up", icon: FiUnlock },
  { asset: "ETH", type: "Locked · 90 days", apy: "9.8%", lock: "90 days", icon: FiLock },
  { asset: "SOL", type: "Locked · 60 days", apy: "11.4%", lock: "60 days", icon: FiLock },
  { asset: "BNB", type: "Flexible", apy: "4.5%", lock: "No lock-up", icon: FiUnlock },
];

export function StakingProducts() {
  return (
    <section id="staking" className="border-y border-border bg-muted/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Earn while you hold</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Flexible and locked staking products with auto-compounding rewards.
            </p>
          </div>
          <Link href="/staking" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <Card key={`${product.asset}-${product.type}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <product.icon className="h-4 w-4" />
                  </span>
                  <Badge variant={product.lock === "No lock-up" ? "success" : "outline"}>
                    {product.lock}
                  </Badge>
                </div>
                <div className="mt-4 text-lg font-bold">{product.asset}</div>
                <div className="text-xs text-muted-foreground">{product.type}</div>
                <div className="mt-3 text-2xl font-bold text-success">{product.apy}</div>
                <div className="text-xs text-muted-foreground">Estimated APY</div>
                <Link href="/staking">
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Stake Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
