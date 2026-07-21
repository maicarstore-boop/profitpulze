import type { Metadata } from "next";
import { FiShield, FiLock, FiEye, FiKey, FiServer, FiUserCheck, FiAward, FiFileText } from "react-icons/fi";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Security — ProfitPulze",
};

const FEATURES = [
  { icon: FiLock, title: "Cold Storage", description: "95%+ of assets held in offline, geographically distributed cold wallets." },
  { icon: FiKey, title: "Two-Factor & Passkeys", description: "WebAuthn, authenticator apps, and hardware key support on every account." },
  { icon: FiEye, title: "24/7 Monitoring", description: "Real-time anomaly detection across withdrawals, logins, and API activity." },
  { icon: FiShield, title: "Proof of Reserves", description: "Independently audited reserves published on a regular cadence." },
  { icon: FiServer, title: "Infrastructure Hardening", description: "Rate limiting, WAF, DDoS protection, and isolated trading infrastructure." },
  { icon: FiUserCheck, title: "Device & Session Control", description: "Manage trusted devices, active sessions, and get alerted on new logins." },
];

const PROGRAM = [
  { icon: FiAward, title: "Bug Bounty Program", description: "Rewards up to $250,000 for critical vulnerability disclosures via our responsible disclosure program." },
  { icon: FiFileText, title: "Independent Audits", description: "Smart contracts and core infrastructure are audited quarterly by third-party security firms." },
];

export default function SecurityPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Trust & Safety"
        title="Security is not an afterthought"
        description="Enterprise-grade protections designed to keep your assets and data safe, backed by continuous audits and monitoring."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mt-12 text-lg font-semibold">Independent Verification</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PROGRAM.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="flex items-start gap-4 pt-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
