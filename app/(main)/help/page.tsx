import type { Metadata } from "next";
import Link from "next/link";
import { FiSearch, FiCreditCard, FiShield, FiTrendingUp, FiUser, FiHelpCircle } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Help Center — ProfitPulze",
};

const CATEGORIES = [
  { icon: FiUser, title: "Account & Verification", description: "KYC, 2FA, passkeys, device management" },
  { icon: FiCreditCard, title: "Deposits & Withdrawals", description: "Payment methods, network fees, limits" },
  { icon: FiTrendingUp, title: "Trading", description: "Order types, margin, futures, fees" },
  { icon: FiShield, title: "Security", description: "Account protection, phishing, reporting" },
];

const FAQ_ITEMS = [
  {
    question: "How do I enable two-factor authentication?",
    answer: "Go to Account Settings → Security → Two-Factor Authentication, then follow the prompts to link an authenticator app or a passkey.",
  },
  {
    question: "Why is my withdrawal pending review?",
    answer: "Withdrawals above certain thresholds, or from newly added addresses, go through an automated and sometimes manual risk review to protect your account.",
  },
  {
    question: "What are the trading fees?",
    answer: "Spot fees start at 0.1% per side. See the Fees page for the full maker/taker schedule and volume-based discounts.",
  },
  {
    question: "How long do deposits take to confirm?",
    answer: "Deposit times depend on network confirmation requirements — typically a few minutes for most assets, longer during network congestion.",
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Find answers, or reach out to our support team."
        actions={
          <div className="relative w-full max-w-sm">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search help articles..." className="pl-9" />
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="transition-colors hover:border-primary/40">
              <CardContent className="pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
          <div className="mt-4">
            <Accordion items={FAQ_ITEMS} />
          </div>
        </div>

        <Card className="mt-10">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <FiHelpCircle className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">Still need help?</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Our support team is available 24/7. Submit a ticket and we&apos;ll get back to you.
            </p>
            <Link href="/submit-ticket" className="text-sm font-medium text-primary hover:underline">
              Submit a Ticket →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
