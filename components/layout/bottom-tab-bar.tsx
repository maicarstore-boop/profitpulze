"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiBarChart2, FiRepeat, FiZap, FiCreditCard, FiUser } from "react-icons/fi";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: FiHome, match: (p: string) => p === "/" },
  { href: "/markets", label: "Markets", icon: FiBarChart2, match: (p: string) => p.startsWith("/markets") },
  { href: "/trade/BTC-USDT", label: "Trade", icon: FiRepeat, match: (p: string) => p.startsWith("/trade") },
  { href: "/binary/BTC-USDT", label: "Binary", icon: FiZap, match: (p: string) => p.startsWith("/binary") },
  { href: "/wallet", label: "Wallet", icon: FiCreditCard, match: (p: string) => p.startsWith("/wallet") },
  { href: "/dashboard", label: "Account", icon: FiUser, match: (p: string) => p.startsWith("/dashboard") },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-16 grid-cols-6">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
