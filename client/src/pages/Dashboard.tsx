import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSystem } from '@/hooks/useSystem';
import { useVolumes } from '@/hooks/useVolumes';
import { usePools } from '@/hooks/usePools';
import { useAlerts } from '@/hooks/useAlerts';
import { usePerformance } from '@/hooks/usePerformance';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes, formatNumber } from '@/lib/utils';
import { CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export default function Dashboard() {
  const system = useSystem();
  const volumes = useVolumes();
  const pools = usePools();
  const alerts = useAlerts();
  const perf = usePerformance();

  if (system.isLoading || volumes.isLoading) return <PageLoading />;
  if (system.error) return <ErrorMessage message={system.error.message} onRetry={() => system.refetch()} />;

  const sys = system.data!;
  const vols = volumes.data ?? [];
  const poolList = pools.data ?? [];
  const allAlerts = alerts.data ?? [];
  const activeAlerts = allAlerts.filter((a) => a.status === 'active' || a.status === 'acknowledged');
  const perfData = perf.data;

  const onlineNodes = sys.nodes.filter((n) => n.status === 'online').length;
  const totalNodes = sys.nodes.length;
  const directorNodes = Math.min(totalNodes, 1); // Mock: 1 director
  const storageNodes = totalNodes;

  const onlineVols = vols.filter((v) => v.status === 'online').length;
  const degradedVols = vols.filter((v) => v.status === 'degraded').length;
  const offlineVols = vols.filter((v) => v.status === 'offline').length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Dashboards</h1>

      {/* Summary Pills */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-3">
          <span className="text-sm text-muted-foreground">Director Nodes</span>
          <span className="text-lg font-bold">{directorNodes}</span>
        </div>
        <div className="flex items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-3">
          <span className="text-sm text-muted-foreground">Storage Nodes</span>
          <span className="text-lg font-bold">{storageNodes}</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{onlineNodes}</span>
            {totalNodes - onlineNodes > 0 && (
              <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />{totalNodes - onlineNodes}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-3">
          <span className="text-sm text-muted-foreground">Volumes</span>
          <span className="text-lg font-bold">{vols.length}</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{onlineVols}</span>
            {degradedVols > 0 && <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />{degradedVols}</span>}
            {offlineVols > 0 && <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" />{offlineVols}</span>}
          </div>
        </div>
      </div>

      {/* Storage Capacity + Alerts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">
              Storage Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CapacityBar used={sys.totalUsedCapacityBytes} total={sys.totalUsableCapacityBytes} />
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>Used {formatBytes(sys.totalUsedCapacityBytes)}</span>
              <span>Free {formatBytes(sys.totalUsableCapacityBytes - sys.totalUsedCapacityBytes)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">
              Alerts <span className="text-foreground">{activeAlerts.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-muted-foreground">
                <CheckCircle className="mb-2 h-8 w-8 text-vdura-green" />
                <span className="text-sm">No Alerts Found</span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 text-sm">
                    <AlertTriangle className={alert.severity === 'critical' ? 'h-4 w-4 text-vdura-error' : 'h-4 w-4 text-vdura-amber'} />
                    <span className="flex-1 truncate text-muted-foreground">{alert.message}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File System Metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">
            File System Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CapacityBar
            used={poolList.reduce((sum, p) => sum + p.usedCapacityBytes, 0)}
            total={poolList.reduce((sum, p) => sum + p.totalCapacityBytes, 0)}
          />
        </CardContent>
      </Card>

      {/* System Performance */}
      {perfData && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">System Performance</CardTitle>
              <span className="text-xs text-muted-foreground">Last 24h</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Storage Performance</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfData.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333338" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="#555"
                      tick={{ fill: '#888', fontSize: 10 }}
                    />
                    <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2a2a2e', border: '1px solid #333338', borderRadius: 6 }}
                      labelFormatter={(v) => new Date(v as string).toLocaleString()}
                      formatter={(v: number) => formatNumber(Math.round(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="readThroughputMBs" stroke="#22c55e" dot={false} name="Read MB/s" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="writeThroughputMBs" stroke="#ef4444" dot={false} name="Write MB/s" strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadata Operations</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perfData.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333338" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="#555"
                      tick={{ fill: '#888', fontSize: 10 }}
                    />
                    <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2a2a2e', border: '1px solid #333338', borderRadius: 6 }}
                      labelFormatter={(v) => new Date(v as string).toLocaleString()}
                      formatter={(v: number) => formatNumber(Math.round(v))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="readIOPS" stroke="#d4a017" dot={false} name="Creates" strokeWidth={1.5} />
                    <Line type="monotone" dataKey="writeIOPS" stroke="#8b5cf6" dot={false} name="Removes" strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
