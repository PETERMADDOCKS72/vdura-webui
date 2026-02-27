import type { Alert } from '@vdura/shared';
import type { IAlertService } from '../types.js';
import type { SimulatorSystem } from './SimulatorSystem.js';

export class SimulatorAlertService implements IAlertService {
  constructor(private sim: SimulatorSystem) {}

  async getAll(filters?: { severity?: string; status?: string }): Promise<Alert[]> {
    let result = this.sim.alerts;
    if (filters?.severity) {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    return result;
  }

  async acknowledge(id: string): Promise<Alert | undefined> {
    return this.sim.acknowledgeAlert(id);
  }
}
