import type { ServiceRegistry } from '../types.js';
import { loadV5000Config } from './config.js';
import { SshClient } from './SshClient.js';
import { Cache } from './Cache.js';
import { PerformanceAccumulator } from './PerformanceAccumulator.js';
import { V5000SystemService } from './system.service.js';
import { V5000PoolService } from './pool.service.js';
import { V5000VolumeService } from './volume.service.js';
import { V5000HostService } from './host.service.js';
import { V5000AlertService } from './alert.service.js';
import { V5000PerformanceService } from './performance.service.js';

import type { SystemInfo, Pool, Volume, Alert } from '@vdura/shared';

export function createV5000Services(): ServiceRegistry {
  const config = loadV5000Config();
  const ssh = new SshClient(config);

  // Connect eagerly — first API call will trigger connection if not yet ready
  ssh.connect().catch((err) => {
    console.error('[v5000] Initial SSH connection failed (will retry on first request):', err.message);
  });

  // Shared caches
  const systemCache = new Cache<SystemInfo>(config.cacheTtl.system);
  const poolCache = new Cache<Pool[]>(config.cacheTtl.pools);
  const volumeCache = new Cache<Volume[]>(config.cacheTtl.volumes);
  const alertCache = new Cache<Alert[]>(config.cacheTtl.alerts);

  // Performance accumulator (polls on interval)
  const accumulator = new PerformanceAccumulator(ssh, config.perfPollMs);
  accumulator.start();

  // Build services — pool service needed by volume service for name resolution
  const poolService = new V5000PoolService(ssh, poolCache);

  console.log(`[v5000] Initialized: connecting to ${config.host}:${config.port} as ${config.user}`);

  return {
    system: new V5000SystemService(ssh, systemCache),
    pools: poolService,
    volumes: new V5000VolumeService(ssh, volumeCache, poolService),
    hosts: new V5000HostService(),
    alerts: new V5000AlertService(ssh, alertCache),
    performance: new V5000PerformanceService(accumulator),
  };
}
