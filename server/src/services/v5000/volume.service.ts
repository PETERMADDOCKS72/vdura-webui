import type { Volume, CreateVolumeRequest } from '@vdura/shared';
import type { IVolumeService, IPoolService } from '../types.js';
import type { SshClient } from './SshClient.js';
import type { Cache } from './Cache.js';
import { parseVolumeList } from './parsers/volume.parser.js';

const CACHE_KEY = 'volumes-all';

export class V5000VolumeService implements IVolumeService {
  constructor(
    private ssh: SshClient,
    private cache: Cache<Volume[]>,
    private poolService: IPoolService,
  ) {}

  async getAll(): Promise<Volume[]> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const result = await this.ssh.execute('volume list show all');
    const volumes = parseVolumeList(result.output);

    this.cache.set(CACHE_KEY, volumes);
    return volumes;
  }

  async getById(id: string): Promise<Volume | undefined> {
    const volumes = await this.getAll();
    return volumes.find((v) => v.id === id);
  }

  async create(req: CreateVolumeRequest): Promise<Volume> {
    // Resolve poolId to bladeset name
    const pool = await this.poolService.getById(req.poolId);
    const bladesetName = pool?.displayName ?? pool?.name ?? req.poolId;

    // Build the PanCLI command
    const sizeGB = Math.ceil(req.capacityBytes / (1024 ** 3));
    let cmd = `volume create ${req.name} bladeset ${bladesetName} size ${sizeGB}GB`;

    if (req.compressed) {
      cmd += ' compressed yes';
    }

    await this.ssh.execute(cmd);

    // Invalidate cache and re-fetch to get the new volume
    this.cache.invalidate(CACHE_KEY);
    const volumes = await this.getAll();
    const created = volumes.find((v) => v.name === req.name);

    if (!created) {
      // Volume was created but not found in list; construct a minimal representation
      return {
        id: `vol-${req.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: req.name,
        status: 'online',
        capacityBytes: req.capacityBytes,
        usedBytes: 0,
        poolId: req.poolId,
        poolName: bladesetName,
        hostMappings: [],
        ioGroupId: 'default',
        tieringPolicy: req.tieringPolicy ?? 'none',
        compressed: req.compressed ?? false,
        createdAt: new Date().toISOString(),
      };
    }

    return created;
  }

  async delete(id: string): Promise<boolean> {
    const volumes = await this.getAll();
    const volume = volumes.find((v) => v.id === id);
    if (!volume) return false;

    try {
      await this.ssh.executeWithConfirmation(`volume delete ${volume.name}`);
      this.cache.invalidate(CACHE_KEY);
      return true;
    } catch (err) {
      console.error('[v5000] Failed to delete volume:', err instanceof Error ? err.message : err);
      return false;
    }
  }
}
