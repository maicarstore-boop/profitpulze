import { FiShield, FiLock, FiEye, FiKey, FiServer, FiUserCheck } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FiLock,
    title: "Cold Storage",
    description: "95%+ of assets held in offline, geographically distributed cold wallets.",
  },
  {
    icon: FiKey,
    title: "Two-Factor & Passkeys",
    description: "WebAuthn, authenticator apps, and hardware key support on every account.",
  },
  {
    icon: FiEye,
    title: "24/7 Monitoring",
    description: "Real-time anomaly detection across withdrawals, logins, and API activity.",
  },
  {
    icon: FiShield,
    title: "Proof of Reserves",
    description: "Independently audited reserves published on a regular cadence.",
  },
  {
    icon: FiServer,
    title: "Infrastructure Hardening",
    description: "Rate limiting, WAF, DDoS protection, and isolated trading infrastructure.",
  },
  {
    icon: FiUserCheck,
    title: "Device & Session Control",
    description: "Manage trusted devices, active sessions, and get alerted on new logins.",
  },
];

export function SecuritySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Security is not an afterthought</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Enterprise-grade protections designed to keep your assets and data safe.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}
