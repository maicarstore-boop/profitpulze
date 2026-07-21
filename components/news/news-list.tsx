"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NewsItem {
  slug: string;
  category: string;
  title: string;
  summary: string;
  time: string;
}

export function NewsList() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.articles)) setItems(data.articles);
      });
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((n) => n.category)))], [items]);
  const filtered = category === "All" ? items : items.filter((n) => n.category === category);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
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
        {items.length === 0 && <p className="text-sm text-muted-foreground">No news articles yet.</p>}
      </div>
    </div>
  );
}
