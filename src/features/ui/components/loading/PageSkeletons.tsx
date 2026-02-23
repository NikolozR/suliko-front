import { Skeleton } from "@/features/ui/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-5 w-[32rem] max-w-full" />
    </div>
  );
}

export function CardListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: items }).map((_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

export function SplitPanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="h-[420px] rounded-xl" />
      <Skeleton className="h-[420px] rounded-xl" />
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}
