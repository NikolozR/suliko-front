import { Skeleton } from '@/features/ui/components/ui/skeleton';

export default function BlogSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-3/4 mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Search Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
