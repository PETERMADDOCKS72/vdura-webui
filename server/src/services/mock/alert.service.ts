import type { Alert } from '@vdura/shared';
import type { IAlertService } from '../types.js';
import seedData from '../../mock-data/alerts.json' with { type: 'json' };

export class MockAlertService implements IAlertService {
  private alerts: Alert[] = [...seedData] as Alert[];

  async getAll(filters?: { severity?: string; status?: string }): Promise<Alert[]> {
    let result = this.alerts;
    if (filters?.severity) {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status) {
      result = result.filter((a) => a.status === filters.status);
    }
    return result;
  }

  async acknowledge(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return undefined;
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    return alert;
  }
}
