import { PageHeaderSkeleton } from "@/features/ui/components/loading";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-suliko-main-content-bg-color p-4 md:p-8">
      <div className="mx-auto space-y-6">
        <PageHeaderSkeleton />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
