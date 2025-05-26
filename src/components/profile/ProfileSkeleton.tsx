import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 mb-8">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <Skeleton className="h-32 w-32 rounded-full bg-white/20" />
              <div className="text-center lg:text-left space-y-4 flex-1">
                <Skeleton className="h-8 w-64 bg-white/20 mx-auto lg:mx-0" />
                <Skeleton className="h-4 w-48 bg-white/20 mx-auto lg:mx-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 