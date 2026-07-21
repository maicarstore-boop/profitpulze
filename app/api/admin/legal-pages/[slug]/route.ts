import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { LegalPageModel } from "@/models/LegalPage";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await requirePermission("CMS");
  await connectToDatabase();

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content : null;
  if (content === null) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  const page = await LegalPageModel.findOne({ slug });
  if (!page) return NextResponse.json({ error: "Legal page not found." }, { status: 404 });

  const previousContent = page.content;
  page.content = content;
  await page.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "legal_page.update",
    targetType: "LegalPage",
    targetId: slug,
    previousValue: { content: previousContent },
    newValue: { content },
    request,
  });

  return NextResponse.json({ page: { slug: page.slug, title: page.title, content: page.content, updatedAt: page.updatedAt } });
}
