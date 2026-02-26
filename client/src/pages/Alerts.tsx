import { useState } from 'react';
import { useAlerts, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CheckCircle } from 'lucide-react';

export default function Alerts() {
  const [severity, setSeverity] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const filters = {
    ...(severity && { severity }),
    ...(status && { status }),
  };
  const { data: alerts, isLoading, error, refetch } = useAlerts(Object.keys(filters).length ? filters : undefined);
  const ack = useAcknowledgeAlert();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Alerts</h1>

      <div className="flex gap-4">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        {(severity || status) && (
          <Button variant="ghost" onClick={() => { setSeverity(''); setStatus(''); }}>Clear</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(alerts ?? []).map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                  <TableCell><StatusBadge status={alert.status} /></TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell className="font-mono text-xs">{alert.source}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {alert.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => ack.mutate(alert.id)}
                        title="Acknowledge"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
