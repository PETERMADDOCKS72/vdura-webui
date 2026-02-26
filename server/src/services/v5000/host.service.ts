import type { Host } from '@vdura/shared';
import type { IHostService } from '../types.js';

export class V5000HostService implements IHostService {
  async getAll(): Promise<Host[]> {
    return [];
  }

  async getById(_id: string): Promise<Host | undefined> {
    return undefined;
  }
}
