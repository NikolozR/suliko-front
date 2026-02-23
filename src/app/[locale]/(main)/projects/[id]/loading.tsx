import { EditorSkeleton, PageHeaderSkeleton, SplitPanelSkeleton } from "@/features/ui/components/loading";

export default function ProjectDetailsLoading() {
  return (
    <div className="min-h-screen bg-suliko-main-content-bg-color p-4 md:p-8">
      <div className="mx-auto space-y-6">
        <PageHeaderSkeleton />
        <SplitPanelSkeleton />
        <EditorSkeleton />
      </div>
    </div>
  );
}
