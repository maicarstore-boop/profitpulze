import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { SiteContentModel, SITE_CONTENT_SINGLETON_KEY } from "@/models/SiteContent";
import { recordAuditLog } from "@/lib/audit";

async function getOrCreateContent() {
  await connectToDatabase();
  let content = await SiteContentModel.findOne({ key: SITE_CONTENT_SINGLETON_KEY });
  if (!content) content = await SiteContentModel.create({ key: SITE_CONTENT_SINGLETON_KEY });
  return content;
}

export async function GET() {
  await requirePermission("CMS");
  const content = await getOrCreateContent();
  return NextResponse.json({ content });
}

export async function PATCH(request: Request) {
  const admin = await requirePermission("CMS");
  const content = await getOrCreateContent();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

  const previous = { heroHeadline: content.heroHeadline, heroSubheadline: content.heroSubheadline, banners: content.banners };

  if (typeof body.heroHeadline === "string") content.heroHeadline = body.heroHeadline;
  if (typeof body.heroSubheadline === "string") content.heroSubheadline = body.heroSubheadline;
  if (Array.isArray(body.banners)) {
    content.banners = body.banners
      .filter((b: unknown) => typeof b === "object" && b !== null && typeof (b as { text?: unknown }).text === "string")
      .map((b: { text: string; active?: boolean }) => ({ text: b.text, active: b.active ?? true }));
  }

  await content.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "site_content.update",
    targetType: "SiteContent",
    targetId: SITE_CONTENT_SINGLETON_KEY,
    previousValue: previous,
    newValue: { heroHeadline: content.heroHeadline, heroSubheadline: content.heroSubheadline, banners: content.banners },
    request,
  });

  return NextResponse.json({ content });
}
