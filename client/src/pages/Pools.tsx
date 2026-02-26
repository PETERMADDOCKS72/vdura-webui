import { usePools } from '@/hooks/usePools';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CapacityBar } from '@/components/common/CapacityBar';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function Pools() {
  const { data: pools, isLoading, error, refetch } = usePools();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Storage Pools</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(pools ?? []).map((pool) => (
          <Card key={pool.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{pool.name}</CardTitle>
              <StatusBadge status={pool.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              <CapacityBar used={pool.usedCapacityBytes} total={pool.totalCapacityBytes} />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">RAID</span>
                  <p className="font-medium">{pool.raidLevel}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tier</span>
                  <p><Badge variant="secondary">{pool.tier}</Badge></p>
                </div>
                <div>
                  <span className="text-muted-foreground">Volumes</span>
                  <p className="font-medium">{pool.volumeCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Drives</span>
                  <p className="font-medium">{pool.driveCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
