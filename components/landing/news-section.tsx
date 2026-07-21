import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { connectToDatabase } from "@/lib/db";
import { NewsArticleModel } from "@/models/NewsArticle";

function timeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function getLatestNews() {
  try {
    await connectToDatabase();
    const articles = await NewsArticleModel.find({ published: true }).sort({ createdAt: -1 }).limit(4).lean();
    return articles.map((a) => ({ slug: a.slug, category: a.category, title: a.title, summary: a.summary, time: timeAgo(a.createdAt) }));
  } catch {
    return [];
  }
}

export async function NewsSection() {
  const items = await getLatestNews();
  if (items.length === 0) return null;

  return (
    <section id="news" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Latest News</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay informed with market-moving headlines, curated in real time.
          </p>
        </div>
        <Link href="/news" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.slug} className="flex flex-col justify-between transition-colors hover:border-primary/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Badge variant="primary">{item.category}</Badge>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
