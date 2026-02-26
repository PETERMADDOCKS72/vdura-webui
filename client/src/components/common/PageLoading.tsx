import { Skeleton } from '@/components/ui/skeleton';

export function PageLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
