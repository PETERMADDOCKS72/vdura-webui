import type { Volume, CreateVolumeRequest } from '@vdura/shared';
import type { IVolumeService } from '../types.js';
import seedData from '../../mock-data/volumes.json' with { type: 'json' };

export class MockVolumeService implements IVolumeService {
  private volumes: Volume[] = [...seedData] as Volume[];

  async getAll(): Promise<Volume[]> {
    return this.volumes;
  }

  async getById(id: string): Promise<Volume | undefined> {
    return this.volumes.find((v) => v.id === id);
  }

  async create(req: CreateVolumeRequest): Promise<Volume> {
    const pool = seedData.find((v) => v.poolId === req.poolId);
    const volume: Volume = {
      id: `vol-${String(this.volumes.length + 1).padStart(3, '0')}`,
      name: req.name,
      status: 'online',
      capacityBytes: req.capacityBytes,
      usedBytes: 0,
      poolId: req.poolId,
      poolName: pool?.poolName ?? 'Unknown',
      hostMappings: [],
      ioGroupId: 'io-grp-0',
      tieringPolicy: req.tieringPolicy ?? 'auto',
      compressed: req.compressed ?? false,
      createdAt: new Date().toISOString(),
    };
    this.volumes.push(volume);
    return volume;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.volumes.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    this.volumes.splice(idx, 1);
    return true;
  }
}
