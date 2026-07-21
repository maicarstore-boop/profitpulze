import { Skeleton, SkeletonStatGrid, SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-8 w-64" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonStatGrid count={3} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
