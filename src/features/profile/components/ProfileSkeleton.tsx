import { Card, CardContent, CardHeader } from "@/features/ui/components/ui/card";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
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

      {/* Updated Cards Skeleton to match ProfilePersonalInfo and ProfileContactInfo structure */}
      <div className="space-y-6">
        {/* Skeleton for ProfilePersonalInfo */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-6 px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 p-2 rounded-lg bg-gray-200 dark:bg-gray-700" /> {/* Icon placeholder */}
              <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" /> {/* Title placeholder */}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 mb-1 bg-gray-200 dark:bg-gray-700" /> {/* Label */}
                <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" /> {/* Input/Text */}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 mb-1 bg-gray-200 dark:bg-gray-700" /> {/* Label */}
                <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" /> {/* Input/Text */}
              </div>
            </div>
            <Skeleton className="h-px w-full bg-gray-200 dark:bg-gray-700" /> {/* Separator */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-1 bg-gray-200 dark:bg-gray-700" /> {/* Label */}
              <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" /> {/* Input/Text */}
            </div>
          </CardContent>
        </Card>

        {/* Skeleton for ProfileContactInfo */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-6 px-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 p-2 rounded-lg bg-gray-200 dark:bg-gray-700" /> {/* Icon placeholder */}
              <Skeleton className="h-6 w-40 bg-gray-200 dark:bg-gray-700" /> {/* Title placeholder */}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 pt-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 dark:bg-muted/20">
              <Skeleton className="h-10 w-10 p-3 rounded-lg bg-gray-200 dark:bg-gray-700" /> {/* Icon placeholder */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28 bg-gray-200 dark:bg-gray-700" /> {/* Label */}
                <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" /> {/* Text */}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 dark:bg-muted/20">
              <Skeleton className="h-10 w-10 p-3 rounded-lg bg-gray-200 dark:bg-gray-700" /> {/* Icon placeholder */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 mb-1 bg-gray-200 dark:bg-gray-700" /> {/* Label */}
                <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" /> {/* Input/Text */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 