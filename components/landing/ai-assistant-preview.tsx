import Link from "next/link";
import { FiCpu, FiTrendingUp, FiShield, FiSearch } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CAPABILITIES = [
  { icon: FiTrendingUp, label: "Portfolio & risk analysis" },
  { icon: FiSearch, label: "Natural language market search" },
  { icon: FiShield, label: "Plain-English indicator explanations" },
];

export function AiAssistantPreview() {
  return (
    <section id="ai-assistant" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <FiCpu className="h-3.5 w-3.5 text-primary" />
            AI Trading Assistant
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            Understand the market before you move
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ask questions in plain language and get instant market summaries, technical
            analysis, and educational insights — the assistant explains the &ldquo;why&rdquo;
            behind the data. It surfaces analysis and education, not personalized
            financial advice.
          </p>

          <ul className="mt-6 space-y-3">
            {CAPABILITIES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <Link href="/ai-assistant">
            <Button size="lg" className="mt-6">
              Try the AI Assistant
            </Button>
          </Link>
        </div>

        <Card className="bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiCpu className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">ProfitPulze AI</span>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
                Why did ETH move in the last hour?
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 leading-relaxed">
                ETH is up 3.4% over 24h on higher spot volume and renewed staking
                inflows following the network upgrade. RSI is at 61 (neutral-bullish),
                and it&apos;s trading above its 50-period moving average — a level to
                watch for support if momentum cools. This is market analysis, not
                financial advice.
              </div>
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
                Summarize my portfolio risk
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 leading-relaxed">
                62% of your holdings are concentrated in BTC and ETH. Your portfolio
                beta relative to the broader market is 1.2 — slightly more volatile
                than the market average.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
