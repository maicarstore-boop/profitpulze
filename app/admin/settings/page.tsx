"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FiAlertTriangle } from "react-icons/fi";

interface Settings {
  platformName: string;
  supportEmail: string;
  makerFeePercent: number;
  takerFeePercent: number;
  rateLimitPerMinute: number;
  smtpHost: string;
  smtpPort: number;
  websocketUrl: string;
  maintenanceMode: boolean;
}

function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (fields: Partial<Settings>) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  };

  return { settings, patch };
}

function ExchangeTab({ settings, patch }: { settings: Settings; patch: (f: Partial<Settings>) => Promise<void> }) {
  const [platformName, setPlatformName] = useState(settings.platformName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [makerFee, setMakerFee] = useState(String(settings.makerFeePercent));
  const [takerFee, setTakerFee] = useState(String(settings.takerFeePercent));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Exchange Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input id="platform-name" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="support-email">Support Email</Label>
            <Input id="support-email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="mt-1" />
          </div>
          <Button size="sm" onClick={() => patch({ platformName, supportEmail })}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Fee Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label htmlFor="maker-fee">Default Maker Fee (%)</Label>
            <Input id="maker-fee" value={makerFee} onChange={(e) => setMakerFee(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="taker-fee">Default Taker Fee (%)</Label>
            <Input id="taker-fee" value={takerFee} onChange={(e) => setTakerFee(e.target.value)} className="mt-1" />
          </div>
          <Button size="sm" onClick={() => patch({ makerFeePercent: Number(makerFee), takerFeePercent: Number(takerFee) })}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfraTab({ settings, patch }: { settings: Settings; patch: (f: Partial<Settings>) => Promise<void> }) {
  const [rateLimit, setRateLimit] = useState(String(settings.rateLimitPerMinute));
  const [smtpHost, setSmtpHost] = useState(settings.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(settings.smtpPort));
  const [websocketUrl, setWebsocketUrl] = useState(settings.websocketUrl);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>API Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label htmlFor="rate-limit">Rate Limit (req/min)</Label>
            <Input id="rate-limit" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} className="mt-1" />
          </div>
          <Button size="sm" onClick={() => patch({ rateLimitPerMinute: Number(rateLimit) })}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.provider.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="smtp-port">Port</Label>
            <Input id="smtp-port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="mt-1" />
          </div>
          <Button size="sm" onClick={() => patch({ smtpHost, smtpPort: Number(smtpPort) })}>Save</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>WebSocket Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label htmlFor="ws-url">WebSocket URL</Label>
            <Input id="ws-url" value={websocketUrl} onChange={(e) => setWebsocketUrl(e.target.value)} placeholder="wss://stream.profitpulze.com" className="mt-1" />
          </div>
          <Button size="sm" onClick={() => patch({ websocketUrl })}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MaintenanceTab({ settings, patch }: { settings: Settings; patch: (f: Partial<Settings>) => Promise<void> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>Really blocks new binary trades and staking deposits platform-wide while enabled</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {settings.maintenanceMode && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              <FiAlertTriangle className="h-3.5 w-3.5" /> Maintenance mode is currently ON — trading and staking are blocked for all users.
            </div>
          )}
          <Button
            variant={settings.maintenanceMode ? "danger" : "outline"}
            size="sm"
            onClick={() => patch({ maintenanceMode: !settings.maintenanceMode })}
          >
            {settings.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Backup Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
          <p>Automated backups aren&apos;t wired up in this build — MongoDB Atlas handles backups at the cluster level outside this app.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { settings, patch } = useSettings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real, persisted exchange configuration — maintenance mode is actually enforced.</p>
      </div>
      {settings && (
        <Tabs
          items={[
            { key: "exchange", label: "Exchange & Fees", content: <ExchangeTab settings={settings} patch={patch} /> },
            { key: "infra", label: "API, SMTP & WebSocket", content: <InfraTab settings={settings} patch={patch} /> },
            { key: "maintenance", label: "Maintenance & Backup", content: <MaintenanceTab settings={settings} patch={patch} /> },
          ]}
        />
      )}
    </div>
  );
}
