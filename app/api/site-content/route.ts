import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SiteContentModel, SITE_CONTENT_SINGLETON_KEY } from "@/models/SiteContent";

export async function GET() {
  await connectToDatabase();
  const content = await SiteContentModel.findOne({ key: SITE_CONTENT_SINGLETON_KEY }).lean();

  return NextResponse.json({
    heroHeadline: content?.heroHeadline ?? "Trade crypto with confidence",
    heroSubheadline:
      content?.heroSubheadline ?? "Spot, margin, and futures trading with institutional-grade infrastructure.",
    banners: (content?.banners ?? []).filter((b) => b.active).map((b) => b.text),
  });
}
