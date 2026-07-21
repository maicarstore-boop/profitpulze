"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { ADMIN_NAV } from "@/lib/admin-nav";

const LABEL_BY_HREF = new Map<string, string>();
for (const group of ADMIN_NAV) {
  if (group.href) LABEL_BY_HREF.set(group.href, group.label);
  group.children?.forEach((child) => LABEL_BY_HREF.set(child.href, child.label));
}

function humanize(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // ["admin", "users", "<id>"]

  const crumbs = segments.map((_, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = LABEL_BY_HREF.get(href) ?? humanize(segments[i]!);
    return { href, label };
  });

  return (
    <div className="flex items-center gap-1.5 border-b border-border bg-background px-4 py-2.5 text-sm text-muted-foreground sm:px-6">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <FiChevronRight className="h-3.5 w-3.5" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
