import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { serializeAnnouncement } from "@/lib/announcements";
import { connectToDatabase } from "@/lib/db";
import { AnnouncementModel } from "@/models/Announcement";

const schema = z.object({ action: z.enum(["unpublish", "republish"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("Notifications");
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  await connectToDatabase();
  const existing = await AnnouncementModel.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  }

  const republish = parsed.data.action === "republish";
  if (republish && existing.expiresAt && existing.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This banner has expired. Publish a new one instead." }, { status: 422 });
  }

  const updated = await AnnouncementModel.findByIdAndUpdate(
    id,
    { $set: { active: republish, unpublishedAt: republish ? null : new Date() } },
    { new: true }
  ).lean();
  if (!updated) {
    return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
  }

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: `announcement.${parsed.data.action}`,
    targetType: "Announcement",
    targetId: id,
    previousValue: { active: existing.active },
    newValue: { active: updated.active },
    request,
  });

  return NextResponse.json({ announcement: serializeAnnouncement(updated) });
}
