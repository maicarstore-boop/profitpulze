import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { NewsArticleModel } from "@/models/NewsArticle";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("CMS");
  await connectToDatabase();

  const { id } = await params;
  const article = await NewsArticleModel.findById(id);
  if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const previous = { title: article.title, category: article.category, summary: article.summary, published: article.published };

  if (typeof body?.title === "string") article.title = body.title;
  if (typeof body?.category === "string") article.category = body.category;
  if (typeof body?.summary === "string") article.summary = body.summary;
  if (typeof body?.published === "boolean") article.published = body.published;

  await article.save();

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "news.update",
    targetType: "NewsArticle",
    targetId: id,
    previousValue: previous,
    newValue: { title: article.title, category: article.category, summary: article.summary, published: article.published },
    request,
  });

  return NextResponse.json({
    article: { id: article._id.toString(), slug: article.slug, category: article.category, title: article.title, summary: article.summary, published: article.published },
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePermission("CMS");
  await connectToDatabase();

  const { id } = await params;
  const article = await NewsArticleModel.findByIdAndDelete(id);
  if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "news.delete",
    targetType: "NewsArticle",
    targetId: id,
    previousValue: { title: article.title },
    request,
  });

  return NextResponse.json({ success: true });
}
