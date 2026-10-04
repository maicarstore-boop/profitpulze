import { NextResponse } from "next/server";
import { getActiveAnnouncements } from "@/lib/announcements";

export async function GET() {
  try {
    const announcements = await getActiveAnnouncements();
    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a._id.toString(),
        headline: a.headline,
        message: a.message,
        severity: a.severity,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    // The banner is non-essential — never let it break page chrome.
    console.error("GET /api/announcements:", error);
    return NextResponse.json({ announcements: [] });
  }
}
