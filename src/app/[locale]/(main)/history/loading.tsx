import { CardListSkeleton, PageHeaderSkeleton } from "@/features/ui/components/loading";

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-suliko-main-content-bg-color p-4 md:p-8">
      <div className="mx-auto space-y-6">
        <PageHeaderSkeleton />
        <CardListSkeleton items={4} />
      </div>
    </div>
  );
}
