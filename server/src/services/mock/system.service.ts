import type { SystemInfo } from '@vdura/shared';
import type { ISystemService } from '../types.js';
import seedData from '../../mock-data/system.json' with { type: 'json' };

export class MockSystemService implements ISystemService {
  async getInfo(): Promise<SystemInfo> {
    return seedData as SystemInfo;
  }
}
