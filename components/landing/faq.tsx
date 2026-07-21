import { Accordion } from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Is my cryptocurrency safe on ProfitPulze?",
    answer:
      "Over 95% of user assets are held in offline cold storage, and we publish independently audited proof-of-reserves. Accounts are additionally protected with 2FA, passkeys, and device management.",
  },
  {
    question: "What trading pairs and order types are supported?",
    answer:
      "We support major spot pairs including BTC/USDT, ETH/USDT, SOL/USDT, and more, plus margin and futures markets. Order types include market, limit, stop-limit, take-profit/stop-loss, trailing stop, OCO, and iceberg orders.",
  },
  {
    question: "How do deposits and withdrawals work?",
    answer:
      "Deposits are credited after network-specific confirmation thresholds are met. Withdrawals go through automated risk checks and, above certain thresholds, manual review for your protection.",
  },
  {
    question: "Does the AI assistant give financial advice?",
    answer:
      "No. The AI assistant provides market analysis, educational explanations, and portfolio summaries. It does not provide personalized financial advice, and all trading decisions remain yours.",
  },
  {
    question: "What fees does ProfitPulze charge?",
    answer:
      "Spot trading fees start at 0.1% per side and decrease with 30-day trading volume and native token holdings. Full fee schedules for margin, futures, and withdrawals are published in the Fees section.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>
      </div>
      <div className="mt-8">
        <Accordion items={FAQ_ITEMS} />
      </div>
    </section>
  );
}
