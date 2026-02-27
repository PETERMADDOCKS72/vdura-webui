import type { ServiceRegistry } from '../types.js';
import { SimulatorSystem } from './SimulatorSystem.js';
import { SimulatorVolumeService } from './volume.service.js';
import { SimulatorPoolService } from './pool.service.js';
import { SimulatorHostService } from './host.service.js';
import { SimulatorAlertService } from './alert.service.js';
import { SimulatorPerformanceService } from './performance.service.js';
import { SimulatorSystemService } from './system.service.js';

export function createSimulatorServices(): ServiceRegistry {
  const sim = new SimulatorSystem();
  console.log(
    `[simulator] Initialized: ${sim.nodes.length} nodes, ${sim.pools.length} pools, ` +
    `${sim.volumes.length} volumes, ${sim.hosts.length} hosts, ${sim.alerts.length} alerts`,
  );
  return {
    volumes: new SimulatorVolumeService(sim),
    pools: new SimulatorPoolService(sim),
    hosts: new SimulatorHostService(sim),
    alerts: new SimulatorAlertService(sim),
    performance: new SimulatorPerformanceService(sim),
    system: new SimulatorSystemService(sim),
  };
}
