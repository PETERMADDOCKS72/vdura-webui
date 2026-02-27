import type { SystemInfo } from '@vdura/shared';
import type { ISystemService } from '../types.js';
import type { SimulatorSystem } from './SimulatorSystem.js';

export class SimulatorSystemService implements ISystemService {
  constructor(private sim: SimulatorSystem) {}

  async getInfo(): Promise<SystemInfo> {
    return this.sim.getSystemInfo();
  }
}
