import { FiZap } from "react-icons/fi";

export function BannerStrip({ banners }: { banners: string[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="border-b border-border bg-primary/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs font-medium text-primary sm:px-6 lg:px-8">
        {banners.map((text) => (
          <span key={text} className="flex items-center gap-1.5">
            <FiZap className="h-3 w-3 shrink-0" /> {text}
          </span>
        ))}
      </div>
    </div>
  );
}
