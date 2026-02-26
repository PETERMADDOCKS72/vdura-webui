import { usePerformance } from '@/hooks/usePerformance';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from 'recharts';

export default function Performance() {
  const { data, isLoading, error, refetch } = usePerformance();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;
  if (!data) return null;

  const timeFmt = (v: string) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Performance</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current IOPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(data.currentIOPS)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Throughput</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.currentThroughputMBs.toFixed(0)} MB/s</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.currentLatencyMs.toFixed(2)} ms</div>
          </CardContent>
        </Card>
      </div>

      {/* IOPS Chart */}
      <Card>
        <CardHeader><CardTitle>IOPS</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="timestamp" tickFormatter={timeFmt} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} formatter={(v: number) => formatNumber(v)} />
                <Area type="monotone" dataKey="readIOPS" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Read" />
                <Area type="monotone" dataKey="writeIOPS" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Write" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Throughput Chart */}
      <Card>
        <CardHeader><CardTitle>Throughput (MB/s)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="timestamp" tickFormatter={timeFmt} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} />
                <Area type="monotone" dataKey="readThroughputMBs" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Read MB/s" />
                <Area type="monotone" dataKey="writeThroughputMBs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Write MB/s" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Latency Chart */}
      <Card>
        <CardHeader><CardTitle>Latency (ms)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="timestamp" tickFormatter={timeFmt} className="text-xs" />
                <YAxis className="text-xs" domain={[0, 'auto']} />
                <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleString()} formatter={(v: number) => `${v.toFixed(2)} ms`} />
                <Line type="monotone" dataKey="readLatencyMs" stroke="#ef4444" name="Read" dot={false} />
                <Line type="monotone" dataKey="writeLatencyMs" stroke="#f97316" name="Write" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
