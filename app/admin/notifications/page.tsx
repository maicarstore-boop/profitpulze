"use client";

import { useState } from "react";
import { FiMail, FiSmartphone, FiMessageSquare, FiBell } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CHANNELS = [
  { key: "email", label: "Email Notifications", icon: FiMail, description: "Transactional and marketing email delivery" },
  { key: "push", label: "Push Notifications", icon: FiSmartphone, description: "Mobile app push via FCM/APNs" },
  { key: "sms", label: "SMS Notifications", icon: FiMessageSquare, description: "One-time codes and critical account alerts" },
  { key: "inApp", label: "In-App Notifications", icon: FiBell, description: "Notification center inside the web/mobile app" },
];

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

      <Card>
        <CardHeader>
          <CardTitle>Announcement Banner</CardTitle>
          <CardDescription>Shown platform-wide at the top of the site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <Input placeholder="Banner headline" />
          <Textarea placeholder="Banner message" />
          <div className="flex gap-3">
            <Select className="w-40" defaultValue="info">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </Select>
            <Button size="sm">Publish Banner</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
