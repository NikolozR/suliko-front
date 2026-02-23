import { EditorSkeleton, PageHeaderSkeleton } from "@/features/ui/components/loading";
import { Skeleton } from "@/features/ui/components/ui/skeleton";

export default function TextTranslationLoading() {
  return (
    <div className="min-h-screen bg-suliko-main-content-bg-color p-4 md:p-8">
      <div className="mx-auto space-y-6">
        <PageHeaderSkeleton />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EditorSkeleton />
          <EditorSkeleton />
        </div>
      </div>
    </div>
  );
}
