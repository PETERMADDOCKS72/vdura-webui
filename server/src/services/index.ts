import type { ServiceRegistry } from './types.js';
import { MockVolumeService } from './mock/volume.service.js';
import { MockPoolService } from './mock/pool.service.js';
import { MockHostService } from './mock/host.service.js';
import { MockAlertService } from './mock/alert.service.js';
import { MockPerformanceService } from './mock/performance.service.js';
import { MockSystemService } from './mock/system.service.js';
import { createSimulatorServices } from './simulator/index.js';
import { createV5000Services } from './v5000/index.js';

function createMockServices(): ServiceRegistry {
  return {
    volumes: new MockVolumeService(),
    pools: new MockPoolService(),
    hosts: new MockHostService(),
    alerts: new MockAlertService(),
    performance: new MockPerformanceService(),
    system: new MockSystemService(),
  };
}

export function createServices(): ServiceRegistry {
  const mode = process.env.API_MODE ?? 'simulator';

  switch (mode) {
    case 'mock':
      return createMockServices();
    case 'simulator':
      return createSimulatorServices();
    case 'v5000':
      return createV5000Services();
    default:
      throw new Error(`Unknown API_MODE: ${mode}`);
  }
}
