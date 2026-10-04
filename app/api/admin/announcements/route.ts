import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { listAnnouncements, serializeAnnouncement } from "@/lib/announcements";
import { connectToDatabase } from "@/lib/db";
import { AnnouncementModel, ANNOUNCEMENT_SEVERITIES } from "@/models/Announcement";

const createSchema = z.object({
  headline: z.string().trim().min(3, "Headline must be at least 3 characters").max(120),
  message: z.string().trim().max(500).default(""),
  severity: z.enum(ANNOUNCEMENT_SEVERITIES),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .nullish()
    .refine((v) => !v || new Date(v) > new Date(), "Expiry must be in the future"),
});

export async function GET() {
  await requirePermission("Notifications");
  const announcements = await listAnnouncements();
  return NextResponse.json({ announcements: announcements.map(serializeAnnouncement) });
}

export async function POST(request: Request) {
  const admin = await requirePermission("Notifications");

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  await connectToDatabase();
  const announcement = await AnnouncementModel.create({
    headline: parsed.data.headline,
    message: parsed.data.message,
    severity: parsed.data.severity,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    publishedById: admin.userId,
    publishedByEmail: admin.email,
  });

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "announcement.publish",
    targetType: "Announcement",
    targetId: announcement._id.toString(),
    newValue: parsed.data,
    request,
  });

  return NextResponse.json({ announcement: serializeAnnouncement(announcement.toObject()) }, { status: 201 });
}
