import Link from "next/link";
import { FiArrowRight, FiZap } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUPPORTED_CURRENCIES } from "@/lib/payments/supported-currencies";

export function DepositCrypto() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <FiZap className="h-3.5 w-3.5 text-primary" />
              Powered by NOWPayments
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Deposit crypto in minutes</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Send BTC, ETH, USDT, and more directly to your ProfitPulze wallet. Get a unique
              deposit address instantly and your balance updates automatically once the network
              confirms the transaction.
            </p>
            <Link href="/wallet?tab=deposit">
              <Button size="lg" className="mt-6">
                Deposit Now
                <FiArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <div
                key={currency.ticker}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 px-3 py-4 text-center"
              >
                <span className="text-sm font-bold">{currency.symbol}</span>
                <span className="text-[10px] text-muted-foreground">{currency.network}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
