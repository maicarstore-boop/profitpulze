import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ChatPanel } from "@/components/ai-assistant/chat-panel";

export const metadata: Metadata = {
  title: "AI Assistant — ProfitPulze",
};

export default function AiAssistantPage() {
  return (
    <div>
      <PageHeader
        eyebrow="AI Trading Assistant"
        title="Ask anything about the markets"
        description="Portfolio analysis, technical indicator explanations, and market summaries — in plain language. Educational insight, not personalized financial advice."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ChatPanel />
      </div>
    </div>
  );
}
