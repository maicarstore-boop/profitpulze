import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { NewsArticleModel } from "@/models/NewsArticle";
import { recordAuditLog } from "@/lib/audit";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function GET() {
  await requirePermission("CMS");
  await connectToDatabase();
  const articles = await NewsArticleModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    articles: articles.map((a) => ({
      id: a._id.toString(),
      slug: a.slug,
      category: a.category,
      title: a.title,
      summary: a.summary,
      published: a.published,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const admin = await requirePermission("CMS");
  await connectToDatabase();

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";

  if (!title || !category || !summary) {
    return NextResponse.json({ error: "Title, category, and summary are required." }, { status: 400 });
  }

  let slug = slugify(title);
  const existing = await NewsArticleModel.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const article = await NewsArticleModel.create({ slug, category, title, summary, published: true });

  await recordAuditLog({
    adminId: admin.userId,
    adminEmail: admin.email,
    action: "news.create",
    targetType: "NewsArticle",
    targetId: article._id.toString(),
    newValue: { title, category, summary },
    request,
  });

  return NextResponse.json({ article: { id: article._id.toString(), slug, category, title, summary, published: true } }, { status: 201 });
}
