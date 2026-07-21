"use client";

import { useCallback, useEffect, useState } from "react";
import { FiDownload, FiFlag, FiX } from "react-icons/fi";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { FiActivity, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface AdminTradeRow {
  id: string;
  userId: string;
  userEmail: string;
  symbol: string;
  contractStyle: string;
  direction: "up" | "down";
  entryPrice: number;
  exitPrice: number | null;
  stake: number;
  potentialPayout: number;
  status: "open" | "settled" | "cancelled";
  result: "win" | "lose" | "draw" | null;
  profitLoss: number | null;
  flagged: boolean;
  adminNote: string;
  cancelReason: string;
  createdAt: string;
}

interface TradeDetail extends AdminTradeRow {
  userStatus: string;
  tradingSuspended: boolean;
  payoutRate: number;
  durationSeconds: number;
  openedAt: string;
  expiresAt: string;
  priceSource: string;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  reason?: string;
  previousValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

interface PriceSnapshot {
  context: string;
  price: number;
  recordedAt: string;
}

const RESULT_VARIANT = { win: "success", lose: "danger", draw: "default" } as const;

function TradeDetailPanel({ tradeId, onClose, onChanged }: { tradeId: string; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<TradeDetail | null>(null);
  const [snapshots, setSnapshots] = useState<PriceSnapshot[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/binary-trades/${tradeId}`);
    const data = await res.json();
    if (res.ok) {
      setDetail(data.trade);
      setSnapshots(data.priceSnapshots ?? []);
      setAuditLog(data.auditLog ?? []);
    }
  }, [tradeId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/binary-trades/${tradeId}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason, note, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setReason("");
      setNote("");
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  if (!detail) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">Loading trade detail…</Card>
    );
  }

  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{detail.symbol}/USDT</h3>
            {detail.status === "settled" ? (
              <Badge variant={RESULT_VARIANT[detail.result ?? "draw"]} className="capitalize">{detail.result}</Badge>
            ) : (
              <StatusBadge status={detail.status} />
            )}
            {detail.flagged && <Badge variant="danger">Flagged</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {detail.userEmail} · Trade ID {detail.id}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Field label="Direction" value={detail.direction} className="capitalize" />
        <Field label="Contract" value={detail.contractStyle.replace(/_/g, " ")} className="capitalize" />
        <Field label="Stake" value={`$${formatPrice(detail.stake)}`} />
        <Field label="Payout Rate" value={`${Math.round(detail.payoutRate * 100)}%`} />
        <Field label="Entry Price" value={`$${formatPrice(detail.entryPrice)}`} />
        <Field label="Exit Price" value={detail.exitPrice ? `$${formatPrice(detail.exitPrice)}` : "—"} />
        <Field
          label="P/L"
          value={detail.profitLoss !== null ? `${detail.profitLoss >= 0 ? "+" : ""}$${formatPrice(detail.profitLoss)}` : "—"}
          valueClassName={detail.profitLoss !== null ? (detail.profitLoss >= 0 ? "text-success" : "text-danger") : undefined}
        />
        <Field label="Opened" value={new Date(detail.openedAt).toLocaleString()} />
      </div>

      {snapshots.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Price Snapshots (immutable)</div>
          <div className="mt-1 flex gap-4 text-xs">
            {snapshots.map((s, i) => (
              <span key={i} className="rounded-md border border-border px-2 py-1">
                {s.context}: ${formatPrice(s.price)} · {new Date(s.recordedAt).toLocaleTimeString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {detail.adminNote && (
        <div className="rounded-lg bg-muted/50 p-3 text-xs">
          <span className="font-medium">Admin note: </span>
          {detail.adminNote}
        </div>
      )}

      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Reason / note for this action…"
            value={reason || note}
            onChange={(e) => {
              setReason(e.target.value);
              setNote(e.target.value);
            }}
            className="flex-1 min-w-[220px]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="danger"
            disabled={busy || detail.status !== "open"}
            onClick={() => runAction("cancel")}
          >
            Cancel Trade & Refund
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => runAction(detail.flagged ? "resolve" : "flag")}>
            <FiFlag className="h-3.5 w-3.5" /> {detail.flagged ? "Resolve Flag" : "Flag for Review"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !note} onClick={() => runAction("note")}>
            Add Note
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => runAction(detail.tradingSuspended ? "unsuspend_trading" : "suspend_trading")}
          >
            {detail.tradingSuspended ? "Restore Trading Privileges" : "Suspend Trading Privileges"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => runAction(detail.userStatus === "frozen" ? "unfreeze_account" : "freeze_account")}
          >
            {detail.userStatus === "frozen" ? "Unfreeze Account" : "Freeze Account"}
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-xs font-medium text-muted-foreground">Audit Log</div>
        <div className="mt-2 space-y-2">
          {auditLog.length === 0 && <p className="text-xs text-muted-foreground">No administrative actions recorded yet.</p>}
          {auditLog.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{entry.action}</span>
                <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-muted-foreground">
                by {entry.adminEmail}
                {entry.reason ? ` — "${entry.reason}"` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("font-medium", className, valueClassName)}>{value}</div>
    </div>
  );
}

export function BinaryTradesTab() {
  const [trades, setTrades] = useState<AdminTradeRow[]>([]);
  const [counts, setCounts] = useState({ open: 0, settled: 0, cancelled: 0 });
  const [status, setStatus] = useState("");
  const [symbol, setSymbol] = useState("");
  const [user, setUser] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ limit: "150" });
    if (status) params.set("status", status);
    if (symbol) params.set("symbol", symbol);
    if (user) params.set("user", user);
    if (flaggedOnly) params.set("flagged", "true");
    return params;
  }, [status, symbol, user, flaggedOnly]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/binary-trades?${buildParams().toString()}`);
    const data = await res.json();
    if (Array.isArray(data.trades)) setTrades(data.trades);
    if (data.counts) setCounts(data.counts);
  }, [buildParams]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const exportUrl = `/api/admin/binary-trades?${buildParams().toString()}&format=csv`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Trades" value={String(counts.open)} icon={FiActivity} sublabel="awaiting settlement" />
        <StatCard label="Settled Trades" value={String(counts.settled)} icon={FiCheckCircle} sublabel="auto-settled from market data" />
        <StatCard label="Cancelled Trades" value={String(counts.cancelled)} icon={FiXCircle} sublabel="refunded to user" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search by user email" value={user} onChange={(e) => setUser(e.target.value)} className="max-w-[220px]" />
        <Input
          placeholder="Symbol (e.g. BTC)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="max-w-[160px]"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="settled">Settled</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
        <a href={exportUrl} download className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FiDownload className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </a>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Exit</th>
              <th className="px-4 py-3 font-medium">Stake</th>
              <th className="px-4 py-3 font-medium">P/L</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Opened</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "cursor-pointer border-b border-border last:border-0 hover:bg-accent",
                  selectedId === t.id && "bg-accent"
                )}
              >
                <td className="px-4 py-3 text-muted-foreground">{t.userEmail}</td>
                <td className="px-4 py-3 font-medium">
                  {t.symbol}/USDT {t.flagged && <FiFlag className="ml-1 inline h-3 w-3 text-danger" />}
                </td>
                <td className="px-4 py-3 capitalize">{t.direction}</td>
                <td className="px-4 py-3 font-mono text-xs">${formatPrice(t.entryPrice)}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.exitPrice ? `$${formatPrice(t.exitPrice)}` : "—"}</td>
                <td className="px-4 py-3">${formatPrice(t.stake)}</td>
                <td
                  className={cn(
                    "px-4 py-3 font-mono text-xs",
                    (t.profitLoss ?? 0) > 0 ? "text-success" : (t.profitLoss ?? 0) < 0 ? "text-danger" : "text-muted-foreground"
                  )}
                >
                  {t.profitLoss !== null ? `${t.profitLoss >= 0 ? "+" : ""}$${formatPrice(t.profitLoss)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {t.status === "settled" ? (
                    <Badge variant={RESULT_VARIANT[t.result ?? "draw"]} className="capitalize">{t.result}</Badge>
                  ) : (
                    <StatusBadge status={t.status} />
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No trades match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {selectedId && <TradeDetailPanel tradeId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />}
    </div>
  );
}
