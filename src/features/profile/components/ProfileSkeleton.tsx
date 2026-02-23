import { Card, CardContent, CardHeader } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Hero Skeleton */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 mb-8 space-y-6">
        <div className="flex items-center gap-6 md:gap-8">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="pt-2 border-t border-border/40 flex items-center gap-3">
          <Skeleton className="h-16 w-44 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Info Skeleton */}
        <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-6 px-6 md:px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 md:px-8 pb-8 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Skeleton */}
        <Card className="border border-border/60 bg-card shadow-sm rounded-2xl">
          <CardHeader className="pb-2 pt-6 px-6 md:px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-36" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 md:px-8 pb-8 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 