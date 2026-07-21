import type { Metadata } from "next";
import { FiCode, FiZap } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "API Documentation — ProfitPulze",
};

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/markets", description: "List all trading pairs and current prices" },
  { method: "GET", path: "/api/v1/markets/{symbol}/candles", description: "Historical OHLCV candle data" },
  { method: "GET", path: "/api/v1/markets/{symbol}/orderbook", description: "Live order book depth" },
  { method: "POST", path: "/api/v1/orders", description: "Place a new spot, margin, or futures order" },
  { method: "DELETE", path: "/api/v1/orders/{orderId}", description: "Cancel an open order" },
  { method: "GET", path: "/api/v1/account/balances", description: "Retrieve wallet balances" },
  { method: "POST", path: "/api/v1/account/withdrawals", description: "Request an asset withdrawal" },
  { method: "GET", path: "/ws/v1/stream", description: "WebSocket stream for real-time market data" },
];

const METHOD_VARIANT: Record<string, "success" | "primary" | "danger" | "outline"> = {
  GET: "success",
  POST: "primary",
  DELETE: "danger",
};

export default function ApiDocsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Developers"
        title="API Documentation"
        description="REST and WebSocket APIs for trading, market data, and account management."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FiCode className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">REST API</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full Swagger/OpenAPI documentation, request signing, and rate limit details.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 pt-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FiZap className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">WebSocket Streams</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subscribe to real-time trades, order book updates, and account events.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-10 text-lg font-semibold">Core Endpoints</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border font-mono text-sm">
          {ENDPOINTS.map((ep) => (
            <div key={ep.path} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
              <Badge variant={METHOD_VARIANT[ep.method] ?? "outline"} className="w-16 shrink-0 justify-center">
                {ep.method}
              </Badge>
              <span className="shrink-0">{ep.path}</span>
              <span className="font-sans text-xs text-muted-foreground">{ep.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
