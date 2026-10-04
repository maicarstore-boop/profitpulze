"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMail, FiSmartphone, FiMessageSquare, FiBell } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const CHANNELS = [
  { key: "email", label: "Email Notifications", icon: FiMail, description: "Transactional and marketing email delivery" },
  { key: "push", label: "Push Notifications", icon: FiSmartphone, description: "Mobile app push via FCM/APNs" },
  { key: "sms", label: "SMS Notifications", icon: FiMessageSquare, description: "One-time codes and critical account alerts" },
  { key: "inApp", label: "In-App Notifications", icon: FiBell, description: "Notification center inside the web/mobile app" },
];

interface AdminAnnouncement {
  id: string;
  headline: string;
  message: string;
  severity: "info" | "warning" | "critical";
  active: boolean;
  expiresAt: string | null;
  publishedByEmail: string;
  unpublishedAt: string | null;
  createdAt: string;
}

const SEVERITY_VARIANT = { info: "default", warning: "primary", critical: "danger" } as const;

const EXPIRY_OPTIONS = [
  { value: "", label: "No expiry" },
  { value: "1", label: "1 hour" },
  { value: "24", label: "24 hours" },
  { value: "72", label: "3 days" },
  { value: "168", label: "7 days" },
];

function AnnouncementManager() {
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AdminAnnouncement["severity"]>("info");
  const [expiryHours, setExpiryHours] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/announcements");
    if (!res.ok) return;
    const data = await res.json();
    setAnnouncements(data.announcements);
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const expiresAt = expiryHours ? new Date(Date.now() + Number(expiryHours) * 3_600_000).toISOString() : null;
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline, message, severity, expiresAt }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to publish banner.");
      return;
    }
    setHeadline("");
    setMessage("");
    setExpiryHours("");
    setSeverity("info");
    load();
  };

  const toggle = async (id: string, action: "unpublish" | "republish") => {
    setError(null);
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
      return;
    }
    load();
  };

  const statusOf = (a: AdminAnnouncement) => {
    if (a.active) return { label: "Live", variant: "success" as const };
    if (!a.unpublishedAt && a.expiresAt) return { label: "Expired", variant: "default" as const };
    return { label: "Unpublished", variant: "outline" as const };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Announcement Banner</CardTitle>
          <CardDescription>Shown platform-wide at the top of the site. Critical banners can&apos;t be dismissed by users.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={publish} className="space-y-4">
            <Input placeholder="Banner headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} />
            <Textarea placeholder="Banner message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="banner-severity">Severity</Label>
                <Select id="banner-severity" className="w-40" value={severity} onChange={(e) => setSeverity(e.target.value as AdminAnnouncement["severity"])}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner-expiry">Expires after</Label>
                <Select id="banner-expiry" className="w-40" value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)}>
                  {EXPIRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <Button size="sm" type="submit" className="h-10" disabled={submitting || headline.trim().length < 3}>
                {submitting ? "Publishing…" : "Publish Banner"}
              </Button>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Published Banners</CardTitle>
        </CardHeader>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Banner</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {announcements === null && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {announcements?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No banners published yet.</td></tr>
            )}
            {announcements?.map((a) => {
              const status = statusOf(a);
              const expired = !!a.expiresAt && new Date(a.expiresAt) <= new Date();
              return (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium">{a.headline}</div>
                    {a.message && <div className="truncate text-xs text-muted-foreground">{a.message}</div>}
                  </td>
                  <td className="px-4 py-3"><Badge variant={SEVERITY_VARIANT[a.severity]} className="capitalize">{a.severity}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{new Date(a.createdAt).toLocaleString()}</div>
                    <div>{a.publishedByEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {a.active ? (
                      <Button size="sm" variant="outline" onClick={() => toggle(a.id, "unpublish")}>Unpublish</Button>
                    ) : !expired ? (
                      <Button size="sm" variant="ghost" onClick={() => toggle(a.id, "republish")}>Republish</Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export default function AdminNotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ email: true, push: true, sms: true, inApp: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Notification Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage delivery channels and platform-wide announcements.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <Card key={channel.key}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <channel.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="font-medium">{channel.label}</div>
                  <div className="text-xs text-muted-foreground">{channel.description}</div>
                </div>
              </div>
              <button
                onClick={() => setEnabled((prev) => ({ ...prev, [channel.key]: !prev[channel.key] }))}
                className={`h-6 w-11 shrink-0 rounded-full transition-colors ${enabled[channel.key] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform ${enabled[channel.key] ? "translate-x-[22px]" : ""}`} />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnnouncementManager />
    </div>
  );
}
