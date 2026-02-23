"use client";

import { Skeleton } from "@/features/ui/components/ui/skeleton";

interface LandingSectionSkeletonProps {
  withCards?: boolean;
}

export default function LandingSectionSkeleton({ withCards = false }: LandingSectionSkeletonProps) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <Skeleton className="mx-auto h-10 w-72" />
          <Skeleton className="mx-auto h-5 w-full max-w-2xl" />
        </div>
        {withCards && (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        )}
      </div>
    </section>
  );
}
