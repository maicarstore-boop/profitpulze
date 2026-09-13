"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMenu, FiX, FiTrendingUp, FiUser, FiLogOut, FiShield, FiSettings } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useAuth } from "@/components/auth/auth-provider";
import { isAdminRole } from "@/lib/auth/roles";

const NAV_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/trade/BTC-USDT", label: "Trade" },
  { href: "/binary/BTC-USDT", label: "Binary" },
  { href: "/staking", label: "Earn" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/news", label: "News" },
];

function AuthActions({ onNavigate }: { onNavigate?: () => void }) {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    onNavigate?.();
    router.push("/");
    router.refresh();
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <NotificationBell />
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FiUser className="h-3.5 w-3.5" />
          {user.email}
        </span>
        <Link href="/settings" onClick={onNavigate}>
          <Button variant="ghost" size="sm">
            <FiSettings className="h-3.5 w-3.5" /> Settings
          </Button>
        </Link>
        {isAdminRole(user.role) && (
          <Link href="/admin" onClick={onNavigate}>
            <Button variant="outline" size="sm">
              <FiShield className="h-3.5 w-3.5" /> Admin
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <FiLogOut className="h-3.5 w-3.5" /> Log Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Link href="/login" onClick={onNavigate}>
        <Button variant="ghost" size="sm">
          Log In
        </Button>
      </Link>
      <Link href="/register" onClick={onNavigate}>
        <Button variant="primary" size="sm">
          Sign Up
        </Button>
      </Link>
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FiTrendingUp className="h-4.5 w-4.5" />
          </span>
          ProfitPulze
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <AuthActions />
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between gap-3">
            <ThemeToggle />
            <AuthActions onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
