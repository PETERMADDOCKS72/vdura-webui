import type { Pool } from '@vdura/shared';
import type { IPoolService } from '../types.js';
import type { SimulatorSystem } from './SimulatorSystem.js';

export class SimulatorPoolService implements IPoolService {
  constructor(private sim: SimulatorSystem) {}

  async getAll(): Promise<Pool[]> {
    return this.sim.pools;
  }

  async getById(id: string): Promise<Pool | undefined> {
    return this.sim.pools.find((p) => p.id === id);
  }
}
