import type { ReactNode } from "react";
import { FiShield, FiZap, FiTrendingUp } from "react-icons/fi";

const HIGHLIGHTS = [
  { icon: FiZap, text: "Sub-millisecond order matching" },
  { icon: FiShield, text: "95%+ of assets in cold storage" },
  { icon: FiTrendingUp, text: "480+ assets across 9 chains" },
];

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted/30 lg:flex lg:items-center lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 30%, color-mix(in oklab, var(--primary) 16%, transparent), transparent)",
          }}
        />
        <div className="relative max-w-sm px-8">
          <h2 className="text-2xl font-bold leading-snug">
            Trade smarter with real-time markets and AI-backed insight.
          </h2>
          <ul className="mt-6 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
