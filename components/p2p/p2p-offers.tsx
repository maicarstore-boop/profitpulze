"use client";

import { useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { p2pOffers } from "@/lib/p2p-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function P2POffers() {
  const [side, setSide] = useState<"buy" | "sell">("buy");

  const offers = p2pOffers.filter((o) => o.side === (side === "buy" ? "sell" : "buy"));

  return (
    <div>
      <div className="flex gap-1 rounded-full border border-border bg-muted/60 p-1 w-fit">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              side === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s} Crypto
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Available</th>
              <th className="px-4 py-3 font-medium">Limits</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3">
                  <div className="font-medium">{offer.merchant}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FiCheckCircle className="h-3 w-3 text-success" />
                    {offer.completionRate}% · {offer.orders.toLocaleString()} orders
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{offer.asset}</td>
                <td className="px-4 py-3">
                  {offer.price.toLocaleString(undefined, { maximumFractionDigits: 4 })} {offer.currency}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {offer.available.toLocaleString()} {offer.asset}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {offer.limitMin.toLocaleString()} - {offer.limitMax.toLocaleString()} {offer.currency}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {offer.paymentMethods.map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant={side === "buy" ? "success" : "danger"}>
                    {side === "buy" ? "Buy" : "Sell"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
