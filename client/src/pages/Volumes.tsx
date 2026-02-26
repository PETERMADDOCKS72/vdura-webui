import { useState } from 'react';
import { useVolumes, useCreateVolume, useDeleteVolume } from '@/hooks/useVolumes';
import { usePools } from '@/hooks/usePools';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CapacityBar } from '@/components/common/CapacityBar';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes } from '@/lib/utils';
import type { Volume } from '@vdura/shared';
import { Plus, Trash2 } from 'lucide-react';

export default function Volumes() {
  const { data: volumes, isLoading, error, refetch } = useVolumes();
  const { data: pools } = usePools();
  const createVolume = useCreateVolume();
  const deleteVolume = useDeleteVolume();
  const [selected, setSelected] = useState<Volume | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Volume | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newCapacityGB, setNewCapacityGB] = useState('');
  const [newPoolId, setNewPoolId] = useState('');

  if (isLoading) return <PageLoading />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const handleCreate = async () => {
    if (!newName || !newCapacityGB || !newPoolId) return;
    await createVolume.mutateAsync({
      name: newName,
      capacityBytes: Number(newCapacityGB) * 1024 * 1024 * 1024,
      poolId: newPoolId,
    });
    setCreateOpen(false);
    setNewName('');
    setNewCapacityGB('');
    setNewPoolId('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteVolume.mutateAsync(deleteTarget.id);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (selected?.id === deleteTarget.id) setSelected(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Volumes</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Volume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Volume</DialogTitle>
              <DialogDescription>Add a new volume to the storage system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vol-name">Name</Label>
                <Input id="vol-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="my-volume" />
              </div>
              <div>
                <Label htmlFor="vol-cap">Capacity (GB)</Label>
                <Input id="vol-cap" type="number" value={newCapacityGB} onChange={(e) => setNewCapacityGB(e.target.value)} placeholder="1024" />
              </div>
              <div>
                <Label>Pool</Label>
                <Select value={newPoolId} onValueChange={setNewPoolId}>
                  <SelectTrigger><SelectValue placeholder="Select pool" /></SelectTrigger>
                  <SelectContent>
                    {(pools ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={createVolume.isPending}>
                  {createVolume.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(volumes ?? []).map((vol) => (
                  <TableRow
                    key={vol.id}
                    className="cursor-pointer"
                    data-state={selected?.id === vol.id ? 'selected' : undefined}
                    onClick={() => setSelected(vol)}
                  >
                    <TableCell className="font-medium">{vol.name}</TableCell>
                    <TableCell><StatusBadge status={vol.status} /></TableCell>
                    <TableCell>{vol.poolName}</TableCell>
                    <TableCell>
                      <CapacityBar used={vol.usedBytes} total={vol.capacityBytes} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(vol);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle>{selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={selected.status} /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{selected.id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pool</span><span>{selected.poolName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{formatBytes(selected.capacityBytes)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Used</span><span>{formatBytes(selected.usedBytes)}</span></div>
              <CapacityBar used={selected.usedBytes} total={selected.capacityBytes} />
              <div className="flex justify-between"><span className="text-muted-foreground">IO Group</span><span>{selected.ioGroupId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tiering</span><span>{selected.tieringPolicy}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Compressed</span><span>{selected.compressed ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hosts</span><span>{selected.hostMappings.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{new Date(selected.createdAt).toLocaleDateString()}</span></div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteVolume.isPending}>
              {deleteVolume.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
