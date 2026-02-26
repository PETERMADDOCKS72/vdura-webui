import { useHosts } from '@/hooks/useHosts';
import { useSystem } from '@/hooks/useSystem';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CheckCircle, AlertTriangle, MinusCircle, Search, SlidersHorizontal } from 'lucide-react';

export default function Nodes() {
  const { data: hosts, isLoading, error, refetch } = useHosts();
  const { data: system } = useSystem();

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const nodes = system?.nodes ?? [];
  const allHosts = hosts ?? [];

  // Split into director nodes (first host) and storage nodes (rest)
  const directorNodes = allHosts.slice(0, 1);
  const storageNodes = allHosts.slice(1);

  const onlineHosts = allHosts.filter((h) => h.status === 'online').length;
  const warningHosts = allHosts.filter((h) => h.status === 'degraded').length;
  const offlineHosts = allHosts.filter((h) => h.status === 'offline').length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Realm Nodes</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Director Nodes <span className="font-bold text-foreground">{directorNodes.length}</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{directorNodes.filter(h => h.status === 'online').length}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" />0</span>
            <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />0</span>
          </div>
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Storage Nodes <span className="font-bold text-foreground">{storageNodes.length}</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{storageNodes.filter(h => h.status === 'online').length}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" />{storageNodes.filter(h => h.status === 'offline').length}</span>
            <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />{storageNodes.filter(h => h.status === 'degraded').length}</span>
          </div>
        </div>
      </div>

      {/* Search/filter icons */}
      <div className="flex justify-end gap-3">
        <button className="text-muted-foreground hover:text-foreground"><Search className="h-4 w-4" /></button>
        <button className="text-muted-foreground hover:text-foreground"><SlidersHorizontal className="h-4 w-4" /></button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Storage Pool</TableHead>
                <TableHead>Data Space</TableHead>
                <TableHead>Metadata Space</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Serial</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Director Nodes Section */}
              <TableRow className="border-border">
                <TableCell colSpan={8} className="py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">Director Nodes</span>
                </TableCell>
              </TableRow>
              {directorNodes.map((host) => (
                <TableRow key={host.id} className="border-border">
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell className="text-muted-foreground">10.10.10.{Math.floor(Math.random() * 100)}</TableCell>
                  <TableCell className="text-muted-foreground">VCH-5000-D1N</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">134.62 GB</span>
                      <div className="h-1.5 w-16 rounded-full bg-vdura-surface-raised">
                        <div className="h-full w-1/3 rounded-full bg-vdura-amber" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={host.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{host.id.replace('host-', '') + 'a3b7c9'}</TableCell>
                </TableRow>
              ))}

              {/* Storage Nodes Section */}
              <TableRow className="border-border">
                <TableCell colSpan={8} className="py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">Storage Nodes</span>
                </TableCell>
              </TableRow>
              {storageNodes.map((host) => (
                <TableRow key={host.id} className="border-border">
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell className="text-muted-foreground">10.10.10.{Math.floor(Math.random() * 100)}</TableCell>
                  <TableCell className="text-muted-foreground">VCH-5000</TableCell>
                  <TableCell>
                    <span className="text-vdura-amber">Set 1</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">61.81 TB</span>
                      <div className="h-1.5 w-16 rounded-full bg-vdura-surface-raised">
                        <div className="h-full w-2/3 rounded-full bg-vdura-amber" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">245.42 GB</span>
                      <div className="h-1.5 w-16 rounded-full bg-vdura-surface-raised">
                        <div className="h-full w-1/2 rounded-full bg-vdura-amber" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={host.status} /></TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{host.id.replace('host-', '') + 'f54e8b'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
