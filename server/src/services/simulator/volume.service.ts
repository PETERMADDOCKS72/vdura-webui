import type { Volume, CreateVolumeRequest } from '@vdura/shared';
import type { IVolumeService } from '../types.js';
import type { SimulatorSystem } from './SimulatorSystem.js';

export class SimulatorVolumeService implements IVolumeService {
  constructor(private sim: SimulatorSystem) {}

  async getAll(): Promise<Volume[]> {
    return this.sim.volumes;
  }

  async getById(id: string): Promise<Volume | undefined> {
    return this.sim.volumes.find((v) => v.id === id);
  }

  async create(req: CreateVolumeRequest): Promise<Volume> {
    return this.sim.createVolume(req);
  }

  async delete(id: string): Promise<boolean> {
    return this.sim.deleteVolume(id);
  }
}
