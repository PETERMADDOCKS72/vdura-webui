import { usePools } from '@/hooks/usePools';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

export default function Pools() {
  const { data: pools, isLoading, error, refetch } = usePools();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Storage Pools</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(pools ?? []).map((pool) => {
          const usedPct = pool.totalCapacityBytes > 0
            ? ((pool.usedCapacityBytes / pool.totalCapacityBytes) * 100).toFixed(2)
            : '0';
          const remaining = pool.availableCapacityBytes;
          const metaUsed = pool.metadataUsedBytes ?? pool.usedCapacityBytes * 0.001;
          const metaTotal = pool.metadataTotalBytes ?? 93.98 * 1024 * 1024 * 1024;
          const metaPct = metaTotal > 0 ? (metaUsed / metaTotal) * 100 : 0;

          return (
            <Card key={pool.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-bold">{pool.displayName ?? pool.name}</CardTitle>
                <StatusBadge status={pool.status} />
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-vdura-amber">
                      Provisioned <HelpCircle className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-medium">
                      {usedPct}% ({formatBytes(remaining)} left)
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-vdura-amber">
                      Compatibility Class
                    </div>
                    <p className="text-sm font-medium">{pool.compatibilityClass ?? 'VCH-5050'}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-vdura-amber">
                      VPODS
                    </div>
                    <p className="text-sm font-medium">
                      {pool.vpodsOnline ?? pool.driveCount}/{pool.vpodCount ?? pool.driveCount} online
                    </p>
                  </div>
                </div>

                {/* Storage Capacity */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">Storage Capacity</span>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(pool.totalCapacityBytes - pool.usedCapacityBytes)} usable / {formatBytes(pool.availableCapacityBytes)} unusable
                    </span>
                  </div>
                  <CapacityBar used={pool.usedCapacityBytes} total={pool.totalCapacityBytes} showLabel={false} />
                </div>

                {/* File System Metadata */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-vdura-amber">
                      File System Metadata <HelpCircle className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(metaUsed)} consumed / {formatBytes(metaTotal - metaUsed)} available
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-vdura-surface-raised">
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div className="bg-vdura-amber" style={{ width: `${Math.min(metaPct, 100)}%` }} />
                      <div className="bg-vdura-surface" style={{ width: `${Math.max(100 - metaPct, 0) * 0.6}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
