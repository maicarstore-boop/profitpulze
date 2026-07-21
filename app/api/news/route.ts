import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { NewsArticleModel } from "@/models/NewsArticle";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const articles = await NewsArticleModel.find({ published: true }).sort({ createdAt: -1 }).limit(limit).lean();

  return NextResponse.json({
    articles: articles.map((a) => ({
      slug: a.slug,
      category: a.category,
      title: a.title,
      summary: a.summary,
      time: timeAgo(a.createdAt),
    })),
  });
}
