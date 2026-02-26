import type { Pool } from '@vdura/shared';
import type { IPoolService } from '../types.js';
import type { SshClient } from './SshClient.js';
import type { Cache } from './Cache.js';
import { parseBladesetList, parseBladesetDetail } from './parsers/bladeset.parser.js';

const CACHE_KEY = 'pools-all';

export class V5000PoolService implements IPoolService {
  constructor(
    private ssh: SshClient,
    private cache: Cache<Pool[]>,
  ) {}

  async getAll(): Promise<Pool[]> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const result = await this.ssh.execute('bladeset list allcolumns');
    const pools = parseBladesetList(result.output);

    this.cache.set(CACHE_KEY, pools);
    return pools;
  }

  async getById(id: string): Promise<Pool | undefined> {
    const pools = await this.getAll();
    const pool = pools.find((p) => p.id === id);
    if (!pool) return undefined;

    // Enrich with detail data
    try {
      const detailResult = await this.ssh.execute(`bladeset detail ${pool.displayName ?? pool.name}`);
      const detail = parseBladesetDetail(detailResult.output);
      return { ...pool, ...detail, id: pool.id, name: pool.name };
    } catch {
      return pool;
    }
  }
}
