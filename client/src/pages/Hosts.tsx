import { useHosts } from '@/hooks/useHosts';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export default function Hosts() {
  const { data: hosts, isLoading, error, refetch } = useHosts();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Hosts</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead>Mapped Volumes</TableHead>
                <TableHead>Identifiers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(hosts ?? []).map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell><StatusBadge status={host.status} /></TableCell>
                  <TableCell><Badge variant="secondary">{host.type.toUpperCase()}</Badge></TableCell>
                  <TableCell>{host.portCount}</TableCell>
                  <TableCell>{host.mappedVolumes.length}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {host.type === 'fc'
                      ? host.wwpns.join(', ')
                      : host.iscsiNames.join(', ')}
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
