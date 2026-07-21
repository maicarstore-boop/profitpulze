"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiMenu,
  FiSidebar,
  FiSearch,
  FiBell,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiExternalLink,
} from "react-icons/fi";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "Withdrawal above threshold", detail: "0.5 BTC withdrawal flagged for manual review", time: "4m ago" },
  { id: "n2", title: "New KYC submission", detail: "3 users awaiting identity verification", time: "22m ago" },
  { id: "n3", title: "Matching engine latency", detail: "BTC/USDT order book latency briefly spiked", time: "1h ago" },
];

export function AdminTopbar({
  adminEmail,
  adminRole,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
}: {
  adminEmail: string;
  adminRole: UserRole;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/admin/users?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      <button
        onClick={onOpenMobile}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <FiMenu className="h-5 w-5" />
      </button>
      <button
        onClick={onToggleCollapse}
        className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <FiSidebar className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="relative hidden max-w-sm flex-1 sm:block">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by email..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="Notifications"
          >
            <FiBell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notifications
              </div>
              {MOCK_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="rounded-lg px-3 py-2 hover:bg-accent">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.detail}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiUser className="h-3.5 w-3.5" />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-tight">{adminEmail}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{ROLE_LABELS[adminRole]}</span>
            </span>
            <FiChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <div className="px-3 py-2">
                <div className="text-sm font-medium">{adminEmail}</div>
                <div className="text-xs text-muted-foreground">{ROLE_LABELS[adminRole]}</div>
              </div>
              <div className="my-1 h-px bg-border" />
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent">
                <FiExternalLink className="h-4 w-4" /> View public site
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                <FiLogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
