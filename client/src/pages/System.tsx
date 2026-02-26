import { useSystem } from '@/hooks/useSystem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes, formatUptime } from '@/lib/utils';

export default function System() {
  const { data, isLoading, error, refetch } = useSystem();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">System</h1>

      {/* System Info */}
      <Card>
        <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div><span className="text-muted-foreground">Cluster Name</span><p className="font-medium">{data.clusterName}</p></div>
            <div><span className="text-muted-foreground">Model</span><p className="font-medium">{data.model}</p></div>
            <div><span className="text-muted-foreground">Serial Number</span><p className="font-mono">{data.serialNumber}</p></div>
            <div><span className="text-muted-foreground">Firmware</span><p className="font-medium">{data.firmwareVersion}</p></div>
            <div><span className="text-muted-foreground">Uptime</span><p className="font-medium">{formatUptime(data.uptimeSeconds)}</p></div>
            <div><span className="text-muted-foreground">Nodes</span><p className="font-medium">{data.nodeCount}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity */}
      <Card>
        <CardHeader><CardTitle>Storage Capacity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-8 text-sm">
            <div><span className="text-muted-foreground">Raw</span><p className="font-medium">{formatBytes(data.totalRawCapacityBytes)}</p></div>
            <div><span className="text-muted-foreground">Usable</span><p className="font-medium">{formatBytes(data.totalUsableCapacityBytes)}</p></div>
            <div><span className="text-muted-foreground">Used</span><p className="font-medium">{formatBytes(data.totalUsedCapacityBytes)}</p></div>
          </div>
          <CapacityBar used={data.totalUsedCapacityBytes} total={data.totalUsableCapacityBytes} />
        </CardContent>
      </Card>

      {/* Nodes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.nodes.map((node) => (
          <Card key={node.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{node.name}</CardTitle>
              <StatusBadge status={node.status} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Serial</span><p className="font-mono">{node.serialNumber}</p></div>
                <div><span className="text-muted-foreground">Firmware</span><p className="font-medium">{node.firmwareVersion}</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>CPU</span><span>{node.cpuUsagePercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${node.cpuUsagePercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Memory</span><span>{node.memoryUsagePercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all"
                    style={{ width: `${node.memoryUsagePercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
