import type { Alert } from '@vdura/shared';
import type { IAlertService } from '../types.js';
import type { SshClient } from './SshClient.js';
import type { Cache } from './Cache.js';
import { parseEventlog } from './parsers/eventlog.parser.js';

const CACHE_KEY = 'alerts-all';

export class V5000AlertService implements IAlertService {
  private acknowledgedIds = new Set<string>();

  constructor(
    private ssh: SshClient,
    private cache: Cache<Alert[]>,
  ) {}

  async getAll(filters?: { severity?: string; status?: string }): Promise<Alert[]> {
    let alerts = this.cache.get(CACHE_KEY);

    if (!alerts) {
      const result = await this.ssh.execute('eventlog -output tab -count 200');
      alerts = parseEventlog(result.output);

      this.cache.set(CACHE_KEY, alerts);
    }

    // Overlay acknowledgement status
    alerts = alerts.map((a) => {
      if (this.acknowledgedIds.has(a.id)) {
        return { ...a, status: 'acknowledged' as const, acknowledgedAt: a.acknowledgedAt ?? new Date().toISOString() };
      }
      return a;
    });

    // Apply filters
    if (filters?.severity) {
      alerts = alerts.filter((a) => a.severity === filters.severity);
    }
    if (filters?.status) {
      alerts = alerts.filter((a) => a.status === filters.status);
    }

    return alerts;
  }

  async acknowledge(id: string): Promise<Alert | undefined> {
    const alerts = await this.getAll();
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return undefined;

    this.acknowledgedIds.add(id);
    return {
      ...alert,
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
    };
  }
}
