import { useState } from 'react';
import { useVolumes, useCreateVolume, useDeleteVolume } from '@/hooks/useVolumes';
import { usePools } from '@/hooks/usePools';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageLoading } from '@/components/common/PageLoading';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { formatBytes } from '@/lib/utils';
import type { Volume } from '@vdura/shared';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';

export default function Volumes() {
  const { data: volumes, isLoading, error, refetch } = useVolumes();
  const { data: pools } = usePools();
  const createVolume = useCreateVolume();
  const deleteVolume = useDeleteVolume();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Volume | null>(null);
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
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Volumes</h1>
        <div className="flex items-center gap-3">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Volume</DialogTitle>
                <DialogDescription>Add a new volume to the storage system.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vol-name">Name</Label>
                  <Input id="vol-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="/my-volume" />
                </div>
                <div>
                  <Label htmlFor="vol-cap">Capacity (GB)</Label>
                  <Input id="vol-cap" type="number" value={newCapacityGB} onChange={(e) => setNewCapacityGB(e.target.value)} placeholder="1024" />
                </div>
                <div>
                  <Label>Storage Pool</Label>
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
          <button className="text-muted-foreground hover:text-foreground"><Search className="h-4 w-4" /></button>
          <button className="text-muted-foreground hover:text-foreground"><SlidersHorizontal className="h-4 w-4" /></button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Component</TableHead>
                <TableHead>Storage Pool</TableHead>
                <TableHead>RAID</TableHead>
                <TableHead>Capacity Used</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reduction Ratio</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(volumes ?? []).map((vol) => {
                const usedPct = vol.capacityBytes > 0 ? (vol.usedBytes / vol.capacityBytes) * 100 : 0;
                const available = vol.capacityBytes - vol.usedBytes;
                return (
                  <TableRow key={vol.id} className="border-border">
                    <TableCell className="font-medium">/{vol.name}</TableCell>
                    <TableCell>
                      <Link to="/pools" className="text-vdura-amber hover:underline">{vol.poolName}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">RAID 6+ (8+2)</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-right text-sm">{formatBytes(vol.usedBytes)}</span>
                        <div className="h-1.5 w-20 rounded-full bg-vdura-surface-raised">
                          <div
                            className="h-full rounded-full bg-vdura-amber"
                            style={{ width: `${Math.min(usedPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatBytes(available)}</TableCell>
                    <TableCell>2.6:1</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={vol.status}
                        label={
                          vol.status === 'degraded'
                            ? `${usedPct.toFixed(0)}% - FSRC`
                            : vol.status === 'offline'
                            ? 'Offline'
                            : 'Good'
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Volume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
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
