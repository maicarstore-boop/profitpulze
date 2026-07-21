"use client";

import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/market-data";
import type { PlacedOrder } from "@/components/trade/trade-panel";
import { cn } from "@/lib/utils";

function OrdersTable({ orders, empty }: { orders: PlacedOrder[]; empty: string }) {
  if (orders.length === 0) {
    return <p className="px-1 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Pair</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Side</th>
            <th className="py-2 font-medium">Price</th>
            <th className="py-2 font-medium">Amount</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-border">
              <td className="py-2.5 text-muted-foreground">{order.time}</td>
              <td className="py-2.5 font-medium">{order.symbol}/USDT</td>
              <td className="py-2.5 text-muted-foreground">{order.type}</td>
              <td className={cn("py-2.5 font-medium", order.side === "buy" ? "text-success" : "text-danger")}>
                {order.side === "buy" ? "Buy" : "Sell"}
              </td>
              <td className="py-2.5">${formatPrice(order.price)}</td>
              <td className="py-2.5">{order.amount.toFixed(4)}</td>
              <td className="py-2.5">
                <Badge variant={order.status === "Filled" ? "success" : "outline"}>
                  {order.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersPanel({ orders }: { orders: PlacedOrder[] }) {
  const open = orders.filter((o) => o.status === "Open");
  const filled = orders.filter((o) => o.status === "Filled");

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Tabs
        items={[
          { key: "open", label: `Open Orders (${open.length})`, content: <OrdersTable orders={open} empty="No open orders yet." /> },
          { key: "history", label: "Order History", content: <OrdersTable orders={filled} empty="No filled orders yet." /> },
          { key: "positions", label: "Position History", content: <OrdersTable orders={[]} empty="No positions yet — futures trading required." /> },
        ]}
      />
    </div>
  );
}
