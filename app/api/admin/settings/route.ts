import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { PlatformSettingsModel, SETTINGS_SINGLETON_KEY } from "@/models/PlatformSettings";
import { recordAuditLog } from "@/lib/audit";

async function getOrCreateSettings() {
  await connectToDatabase();
  let settings = await PlatformSettingsModel.findOne({ key: SETTINGS_SINGLETON_KEY });
  if (!settings) {
    settings = await PlatformSettingsModel.create({ key: SETTINGS_SINGLETON_KEY });
  }
  return settings;
}

const EDITABLE_FIELDS = [
  "platformName",
  "supportEmail",
  "makerFeePercent",
  "takerFeePercent",
  "rateLimitPerMinute",
  "smtpHost",
  "smtpPort",
  "websocketUrl",
  "maintenanceMode",
] as const;

export async function GET() {
  await requirePermission("Settings");
  const settings = await getOrCreateSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("Settings");
  const settings = await getOrCreateSettings();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const previous: Record<string, unknown> = {};
  const next: Record<string, unknown> = {};

  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;
    previous[field] = settings[field];
    (settings as unknown as Record<string, unknown>)[field] = body[field];
    next[field] = body[field];
  }

  if (Object.keys(next).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  await settings.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "platform_settings.update",
    targetType: "PlatformSettings",
    targetId: SETTINGS_SINGLETON_KEY,
    previousValue: previous,
    newValue: next,
    request,
  });

  return NextResponse.json({ settings });
}
