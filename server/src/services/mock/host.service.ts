import type { Host } from '@vdura/shared';
import type { IHostService } from '../types.js';
import seedData from '../../mock-data/hosts.json' with { type: 'json' };

export class MockHostService implements IHostService {
  private hosts: Host[] = [...seedData] as Host[];

  async getAll(): Promise<Host[]> {
    return this.hosts;
  }

  async getById(id: string): Promise<Host | undefined> {
    return this.hosts.find((h) => h.id === id);
  }
}
