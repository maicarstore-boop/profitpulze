import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { LegalPageModel } from "@/models/LegalPage";

export async function GET() {
  await requirePermission("CMS");
  await connectToDatabase();
  const pages = await LegalPageModel.find().sort({ slug: 1 }).lean();
  return NextResponse.json({
    pages: pages.map((p) => ({ slug: p.slug, title: p.title, content: p.content, updatedAt: p.updatedAt })),
  });
}
