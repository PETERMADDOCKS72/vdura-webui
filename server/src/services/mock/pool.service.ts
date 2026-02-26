import type { Pool } from '@vdura/shared';
import type { IPoolService } from '../types.js';
import seedData from '../../mock-data/pools.json' with { type: 'json' };

export class MockPoolService implements IPoolService {
  private pools: Pool[] = [...seedData] as Pool[];

  async getAll(): Promise<Pool[]> {
    return this.pools;
  }

  async getById(id: string): Promise<Pool | undefined> {
    return this.pools.find((p) => p.id === id);
  }
}
