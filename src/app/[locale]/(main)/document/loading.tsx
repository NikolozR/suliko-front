import { Skeleton } from "@/features/ui/components/ui/skeleton";
import { Card, CardContent } from "@/features/ui/components/ui/card";

export default function DocumentTranslationLoading() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-suliko-main-content-bg-color">
      <div className="mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-3" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        
        {/* Tabs Skeleton */}
        <div className="w-full mb-6">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Main Card Skeleton */}
        <Card className="w-full">
          <CardContent className="p-6 space-y-6">
            {/* Language Selectors Skeleton */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* File Upload Area Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="border-2 border-dashed border-border rounded-lg p-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 text-center">
                    <Skeleton className="h-5 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="flex justify-center pt-4">
              <Skeleton className="h-11 w-48" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

