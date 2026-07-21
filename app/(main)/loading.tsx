import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
      <Skeleton className="mx-auto h-6 w-72 rounded-full" />
      <Skeleton className="mx-auto mt-6 h-14 w-full max-w-xl" />
      <Skeleton className="mx-auto mt-5 h-5 w-full max-w-md" />
      <div className="mx-auto mt-8 flex justify-center gap-3">
        <Skeleton className="h-12 w-40 rounded-lg" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}
