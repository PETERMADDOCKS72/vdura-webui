import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSystem } from '@/hooks/useSystem';
import { useVolumes } from '@/hooks/useVolumes';
import { useAlerts } from '@/hooks/useAlerts';
import { usePerformance } from '@/hooks/usePerformance';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes, formatUptime, formatNumber } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const COLORS = ['#3b82f6', '#e5e7eb'];

export default function Dashboard() {
  const system = useSystem();
  const volumes = useVolumes();
  const alerts = useAlerts({ status: 'active' });
  const perf = usePerformance();

  if (system.isLoading || volumes.isLoading) return <PageLoading />;
  if (system.error) return <ErrorMessage message={system.error.message} onRetry={() => system.refetch()} />;

  const sys = system.data!;
  const vols = volumes.data ?? [];
  const activeAlerts = alerts.data ?? [];
  const perfData = perf.data;

  const usedPct = ((sys.totalUsedCapacityBytes / sys.totalUsableCapacityBytes) * 100).toFixed(1);
  const pieData = [
    { name: 'Used', value: sys.totalUsedCapacityBytes },
    { name: 'Free', value: sys.totalUsableCapacityBytes - sys.totalUsedCapacityBytes },
  ];

  const onlineVols = vols.filter((v) => v.status === 'online').length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sys.clusterName}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status="online" />
              <span>Uptime: {formatUptime(sys.uptimeSeconds)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vols.length}</div>
            <p className="text-sm text-muted-foreground">{onlineVols} online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeAlerts.length}</div>
            <p className="text-sm text-muted-foreground">
              {activeAlerts.filter((a) => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IOPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfData ? formatNumber(perfData.currentIOPS) : '—'}</div>
            <p className="text-sm text-muted-foreground">
              {perfData ? `${perfData.currentThroughputMBs.toFixed(0)} MB/s` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity + Alerts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">{usedPct}%</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(sys.totalUsedCapacityBytes)} of {formatBytes(sys.totalUsableCapacityBytes)}
                </p>
                <CapacityBar used={sys.totalUsedCapacityBytes} total={sys.totalUsableCapacityBytes} showLabel={false} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {activeAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3">
                    <SeverityBadge severity={alert.severity} />
                    <div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Sparkline */}
      {perfData && (
        <Card>
          <CardHeader>
            <CardTitle>IOPS (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData.history}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    labelFormatter={(v) => new Date(v as string).toLocaleString()}
                    formatter={(v: number) => formatNumber(v)}
                  />
                  <Area type="monotone" dataKey="readIOPS" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Read IOPS" />
                  <Area type="monotone" dataKey="writeIOPS" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Write IOPS" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
