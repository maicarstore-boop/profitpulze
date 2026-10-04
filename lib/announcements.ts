import "server-only";
import { connectToDatabase } from "@/lib/db";
import { AnnouncementModel } from "@/models/Announcement";

type AnnouncementLean = Awaited<ReturnType<typeof listAnnouncements>>[number];

export function serializeAnnouncement(a: AnnouncementLean) {
  return {
    id: a._id.toString(),
    headline: a.headline,
    message: a.message,
    severity: a.severity,
    active: a.active && (!a.expiresAt || a.expiresAt > new Date()),
    expiresAt: a.expiresAt,
    publishedByEmail: a.publishedByEmail,
    unpublishedAt: a.unpublishedAt,
    createdAt: a.createdAt,
  };
}

/** Banners currently visible to visitors: published and not past their expiry. */
export async function getActiveAnnouncements() {
  await connectToDatabase();
  return AnnouncementModel.find({
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
}

export async function listAnnouncements(limit = 50) {
  await connectToDatabase();
  return AnnouncementModel.find().sort({ createdAt: -1 }).limit(limit).lean();
}
