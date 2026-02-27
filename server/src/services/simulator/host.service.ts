import type { Host } from '@vdura/shared';
import type { IHostService } from '../types.js';
import type { SimulatorSystem } from './SimulatorSystem.js';

export class SimulatorHostService implements IHostService {
  constructor(private sim: SimulatorSystem) {}

  async getAll(): Promise<Host[]> {
    return this.sim.hosts;
  }

  async getById(id: string): Promise<Host | undefined> {
    return this.sim.hosts.find((h) => h.id === id);
  }
}
