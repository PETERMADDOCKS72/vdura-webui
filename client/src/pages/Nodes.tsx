import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useHosts } from '@/hooks/useHosts';
import { useSystem } from '@/hooks/useSystem';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable } from '@/components/common/DataTable';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import type { Host } from '@vdura/shared';

interface NodeRow {
  id: string;
  name: string;
  ip: string;
  model: string;
  storagePool: string;
  dataSpace: string;
  dataSpaceNum: number;
  metadataSpace: string;
  metadataSpaceNum: number;
  status: string;
  serial: string;
  group: 'director' | 'storage';
}

function hostToNodeRow(host: Host, idx: number): NodeRow {
  const isDirector = idx === 0;
  return {
    id: host.id,
    name: host.name,
    ip: `10.10.10.${4 + idx * 3}`,
    model: isDirector ? 'VCH-5000-D1N' : 'VCH-5000',
    storagePool: isDirector ? '\u2014' : `Set ${((idx - 1) % 3) + 1}`,
    dataSpace: isDirector ? '\u2014' : `${(61.81 + idx * 12.3).toFixed(2)} TB`,
    dataSpaceNum: isDirector ? 0 : 61.81 + idx * 12.3,
    metadataSpace: `${(134.62 + idx * 37.8).toFixed(2)} GB`,
    metadataSpaceNum: 134.62 + idx * 37.8,
    status: host.status,
    serial: host.id.replace('host-', '') + 'a3b7c9e' + idx,
    group: isDirector ? 'director' : 'storage',
  };
}

export default function Nodes() {
  const { data: hosts, isLoading, error, refetch } = useHosts();
  const { data: system } = useSystem();

  const nodeRows = useMemo(
    () => (hosts ?? []).map((h, i) => hostToNodeRow(h, i)),
    [hosts],
  );

  const directorCount = nodeRows.filter((n) => n.group === 'director').length;
  const storageRows = nodeRows.filter((n) => n.group === 'storage');
  const onlineStorage = storageRows.filter((n) => n.status === 'online').length;
  const warningStorage = storageRows.filter((n) => n.status === 'degraded').length;
  const offlineStorage = storageRows.filter((n) => n.status === 'offline').length;

  const columns = useMemo<ColumnDef<NodeRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'ip',
        header: 'IP',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.ip}</span>,
      },
      {
        accessorKey: 'model',
        header: 'Model',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.model}</span>,
      },
      {
        accessorKey: 'storagePool',
        header: 'Storage Pool',
        cell: ({ row }) => {
          const val = row.original.storagePool;
          return val === '\u2014' ? (
            <span className="text-muted-foreground">{val}</span>
          ) : (
            <span className="text-vdura-amber">{val}</span>
          );
        },
      },
      {
        accessorKey: 'dataSpaceNum',
        header: 'Data Space',
        cell: ({ row }) => {
          const n = row.original;
          if (n.dataSpace === '\u2014') return <span className="text-muted-foreground">{n.dataSpace}</span>;
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm">{n.dataSpace}</span>
              <div className="h-1.5 w-16 rounded-full bg-vdura-surface-raised">
                <div className="h-full rounded-full bg-vdura-amber" style={{ width: `${Math.min((n.dataSpaceNum / 150) * 100, 100)}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'metadataSpaceNum',
        header: 'Metadata Space',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{row.original.metadataSpace}</span>
            <div className="h-1.5 w-16 rounded-full bg-vdura-surface-raised">
              <div className="h-full rounded-full bg-vdura-amber" style={{ width: `${Math.min((row.original.metadataSpaceNum / 400) * 100, 100)}%` }} />
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        filterFn: 'equalsString',
      },
      {
        accessorKey: 'serial',
        header: 'Data Serial',
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.serial}</span>,
      },
    ],
    [],
  );

  const filters = useMemo(
    () => [
      {
        columnId: 'status',
        label: 'Status',
        options: [
          { value: 'online', label: 'Good' },
          { value: 'degraded', label: 'Warning' },
          { value: 'offline', label: 'Offline' },
        ],
      },
    ],
    [],
  );

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">Realm Nodes</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Director Nodes <span className="font-bold text-foreground">{directorCount}</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{directorCount}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" />0</span>
            <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />0</span>
          </div>
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            Storage Nodes <span className="font-bold text-foreground">{storageRows.length}</span>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-vdura-green"><CheckCircle className="h-3 w-3" />{onlineStorage}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MinusCircle className="h-3 w-3" />{offlineStorage}</span>
            <span className="flex items-center gap-1 text-vdura-amber"><AlertTriangle className="h-3 w-3" />{warningStorage}</span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={nodeRows}
        searchColumn="name"
        searchPlaceholder="Search nodes..."
        filters={filters}
        groupHeader={(row, idx) => {
          // Show group header before first director and first storage row
          if (idx === 0 && row.group === 'director') {
            return <span className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">Director Nodes</span>;
          }
          // Find first storage node
          const isFirstStorage = row.group === 'storage' && (idx === 0 || nodeRows[idx - 1]?.group === 'director');
          if (isFirstStorage) {
            return <span className="text-xs font-semibold uppercase tracking-wider text-vdura-amber">Storage Nodes</span>;
          }
          return null;
        }}
      />
    </div>
  );
}
