"use client";

import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Banner {
  text: string;
  active: boolean;
}

interface Article {
  id: string;
  slug: string;
  category: string;
  title: string;
  summary: string;
  published: boolean;
}

interface LegalPageData {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

function HomepageTab() {
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newBanner, setNewBanner] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/site-content")
      .then((res) => res.json())
      .then((data) => {
        setHeadline(data.content.heroHeadline);
        setSubheadline(data.content.heroSubheadline);
        setBanners(data.content.banners ?? []);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveHero = async () => {
    setBusy(true);
    setSaved(false);
    try {
      await fetch("/api/admin/site-content", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ heroHeadline: headline, heroSubheadline: subheadline }),
      });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const saveBanners = async (next: Banner[]) => {
    setBanners(next);
    await fetch("/api/admin/site-content", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ banners: next }),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" />
          <Textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Subheadline" />
          <Button size="sm" disabled={busy} onClick={saveHero}>{saved ? "Saved" : "Save Changes"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Active Banners</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          {banners.map((banner, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{banner.text}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => saveBanners(banners.map((b, j) => (i === j ? { ...b, active: !b.active } : b)))}>
                  <Badge variant={banner.active ? "success" : "outline"}>{banner.active ? "Live" : "Hidden"}</Badge>
                </button>
                <button onClick={() => saveBanners(banners.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-danger">
                  <FiTrash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={newBanner} onChange={(e) => setNewBanner(e.target.value)} placeholder="New banner text…" className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              disabled={!newBanner.trim()}
              onClick={() => {
                saveBanners([...banners, { text: newBanner.trim(), active: true }]);
                setNewBanner("");
              }}
            >
              <FiPlus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewsTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/news")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.articles)) setArticles(data.articles);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!title.trim() || !category.trim() || !summary.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/news", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, category, summary }),
      });
      setTitle("");
      setCategory("");
      setSummary("");
      load();
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (article: Article) => {
    await fetch(`/api/admin/news/${article.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: !article.published }),
    });
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>New Article</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3 pt-0">
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-40" />
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[200px]" />
          <Input placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="flex-1 min-w-[240px]" />
          <Button size="sm" disabled={busy} onClick={create}><FiPlus className="h-3.5 w-3.5" /> Publish</Button>
        </CardContent>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Headline</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {articles.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{item.title}</td>
                <td className="px-4 py-3"><Badge variant="outline">{item.category}</Badge></td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePublished(item)}>
                    <Badge variant={item.published ? "success" : "outline"}>{item.published ? "Published" : "Draft"}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => remove(item.id)}>Delete</Button>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No articles yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function LegalTab() {
  const [pages, setPages] = useState<LegalPageData[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/legal-pages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.pages)) setPages(data.pages);
      });
  }, []);

  const save = async (slug: string) => {
    const content = drafts[slug];
    if (content === undefined) return;
    setBusySlug(slug);
    try {
      await fetch(`/api/admin/legal-pages/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setPages((prev) => prev.map((p) => (p.slug === slug ? { ...p, content } : p)));
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {pages.map((page) => (
        <Card key={page.slug}>
          <CardContent className="flex flex-col gap-2 pt-6">
            <div className="font-medium">{page.title}</div>
            <div className="text-xs text-muted-foreground">Last updated {new Date(page.updatedAt).toLocaleDateString()}</div>
            <Textarea
              defaultValue={page.content}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [page.slug]: e.target.value }))}
              className="mt-2 h-40 text-xs"
            />
            <Button size="sm" variant="outline" className="mt-2" disabled={busySlug === page.slug} onClick={() => save(page.slug)}>
              Save Content
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminCmsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">CMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage homepage content, news, and legal pages — all persisted and reflected on the live site.
        </p>
      </div>
      <Tabs
        items={[
          { key: "homepage", label: "Homepage & Banners", content: <HomepageTab /> },
          { key: "news", label: "News & Blog", content: <NewsTab /> },
          { key: "legal", label: "FAQs & Legal", content: <LegalTab /> },
        ]}
      />
    </div>
  );
}
