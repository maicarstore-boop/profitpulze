"use client";

import { useState } from "react";
import { FiCpu, FiSend, FiUser } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Why did ETH move in the last hour?",
  "Summarize my portfolio risk",
  "Explain RSI in simple terms",
  "What's the market sentiment on BTC today?",
];

const INITIAL: Message[] = [
  {
    id: "m-0",
    role: "assistant",
    text: "Hi, I'm the ProfitPulze AI assistant. Ask me about market moves, technical indicators, or your portfolio — I'll explain the \"why\" behind the data. I provide analysis and education, not personalized financial advice.",
  },
];

function canned(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("risk") || q.includes("portfolio")) {
    return "Based on typical holdings, concentration in the top 2 assets tends to drive most of your portfolio's volatility. Diversifying across market caps and rebalancing periodically can reduce single-asset risk. This is educational, not personalized financial advice.";
  }
  if (q.includes("rsi") || q.includes("indicator")) {
    return "RSI (Relative Strength Index) measures the speed and magnitude of recent price moves on a 0–100 scale. Above 70 is often read as overbought, below 30 as oversold — but strong trends can stay 'overbought' for a long time, so it's best combined with other signals.";
  }
  if (q.includes("sentiment") || q.includes("btc") || q.includes("bitcoin")) {
    return "Sentiment indicators are currently leaning bullish, supported by rising spot volume and positive funding rates on perpetual futures. Keep in mind sentiment can shift quickly with macro news.";
  }
  if (q.includes("eth") || q.includes("ethereum")) {
    return "ETH's recent move aligns with higher spot volume and renewed staking inflows following the latest network upgrade. It's trading above its 50-period moving average, a level worth watching for support.";
  }
  return "That's a great question. In a full deployment I'd pull live market and account data to answer precisely — for now, try one of the suggested prompts to see a sample analysis.";
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", text };
    const replyMsg: Message = { id: `${Date.now()}-a`, role: "assistant", text: canned(text) };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInput("");
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="flex h-[560px] flex-col pt-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FiCpu className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">ProfitPulze AI</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto py-4 text-sm">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user" ? "bg-muted text-foreground" : "bg-primary/10 text-primary"
                )}
              >
                {m.role === "user" ? <FiUser className="h-3.5 w-3.5" /> : <FiCpu className="h-3.5 w-3.5" />}
              </span>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 leading-relaxed",
                  m.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a market, indicator, or your portfolio..."
            className="flex-1"
          />
          <Button type="submit" size="md">
            <FiSend className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
