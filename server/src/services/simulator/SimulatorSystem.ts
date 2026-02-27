import type { SystemNode, Pool, Volume, Host, Alert, SystemInfo, CreateVolumeRequest } from '@vdura/shared';
import { PerformanceEngine } from './PerformanceEngine.js';
import { buildSeed } from './seed.js';

const TB = 1024 ** 4;

export class SimulatorSystem {
  readonly nodes: SystemNode[];
  readonly pools: Pool[];
  volumes: Volume[];
  readonly hosts: Host[];
  alerts: Alert[];
  readonly meta: { clusterName: string; model: string; serialNumber: string; firmwareVersion: string };
  readonly perfEngine: PerformanceEngine;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private alertCounter: number;

  constructor() {
    const seed = buildSeed();
    this.nodes = seed.nodes;
    this.pools = seed.pools;
    this.volumes = seed.volumes;
    this.hosts = seed.hosts;
    this.alerts = seed.alerts;
    this.meta = seed.systemMeta;
    this.perfEngine = new PerformanceEngine();
    this.alertCounter = this.alerts.length;
    this.startTicking();
  }

  private startTicking(): void {
    const intervalMs = parseInt(process.env.SIM_TICK_MS ?? '300000', 10); // default 5 min
    this.tickTimer = setInterval(() => this.tick(), intervalMs);
    // Don't keep the process alive just for the timer
    if (this.tickTimer.unref) this.tickTimer.unref();
  }

  private tick(): void {
    // 1. New performance data point
    this.perfEngine.tick();

    // 2. Drift volume usage slightly (simulates real I/O)
    for (const vol of this.volumes) {
      if (vol.status === 'offline') continue;
      const drift = (Math.random() - 0.45) * 0.002 * vol.capacityBytes; // slight upward bias
      vol.usedBytes = Math.max(0, Math.min(vol.capacityBytes, vol.usedBytes + drift));
      vol.usedBytes = Math.round(vol.usedBytes);
    }

    // 3. Occasionally generate a new alert (~20% chance per tick)
    if (Math.random() < 0.2) {
      this.alertCounter++;
      const messages = [
        'High latency detected on storage pool IO path',
        'SSD endurance warning - drive approaching write limit',
        'Replication lag exceeds threshold on volume group',
        'Cache hit ratio below 60% for pool operations',
        'Network path redundancy lost on FC port',
      ];
      const severity: ('warning' | 'info')[] = ['warning', 'info'];
      this.alerts.unshift({
        id: `alert-${String(this.alertCounter).padStart(3, '0')}`,
        severity: severity[Math.floor(Math.random() * severity.length)],
        status: 'active',
        message: messages[Math.floor(Math.random() * messages.length)],
        source: this.pools[Math.floor(Math.random() * this.pools.length)].name,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Occasionally resolve an old active alert (~15% chance per tick)
    const activeAlerts = this.alerts.filter((a) => a.status === 'active');
    if (activeAlerts.length > 3 && Math.random() < 0.15) {
      const oldest = activeAlerts[activeAlerts.length - 1];
      oldest.status = 'resolved';
      oldest.resolvedAt = new Date().toISOString();
    }
  }

  getSystemInfo(): SystemInfo {
    const directors = this.nodes.filter((n) => n.role === 'director');
    const storageNodes = this.nodes.filter((n) => n.role === 'storage');
    const totalRaw = this.pools.reduce((s, p) => s + p.totalCapacityBytes, 0);
    const totalUsable = this.pools.reduce((s, p) => s + p.totalCapacityBytes, 0);
    const totalUsed = this.pools.reduce((s, p) => s + p.usedCapacityBytes, 0);

    return {
      clusterName: this.meta.clusterName,
      model: this.meta.model,
      serialNumber: this.meta.serialNumber,
      firmwareVersion: this.meta.firmwareVersion,
      totalRawCapacityBytes: Math.round(totalRaw * 1.25),
      totalUsableCapacityBytes: totalUsable,
      totalUsedCapacityBytes: totalUsed,
      nodeCount: this.nodes.length,
      nodes: this.nodes,
      uptimeSeconds: Math.round((Date.now() - new Date('2025-11-15').getTime()) / 1000),
      directorNodeCount: directors.length,
      storageNodeCount: storageNodes.length,
    };
  }

  createVolume(req: CreateVolumeRequest): Volume {
    const pool = this.pools.find((p) => p.id === req.poolId);
    const vol: Volume = {
      id: `vol-${String(this.volumes.length + 1).padStart(3, '0')}`,
      name: req.name,
      status: 'online',
      capacityBytes: req.capacityBytes,
      usedBytes: 0,
      poolId: req.poolId,
      poolName: pool?.name ?? 'Unknown',
      hostMappings: [],
      ioGroupId: 'io-grp-0',
      tieringPolicy: req.tieringPolicy ?? 'auto',
      compressed: req.compressed ?? false,
      createdAt: new Date().toISOString(),
      reductionRatio: 1.0,
      raidLevel: pool ? `RAID 6+ (${pool.raidConfig ?? '8+2'})` : 'RAID 6+ (8+2)',
    };
    this.volumes.push(vol);
    if (pool) pool.volumeCount++;
    return vol;
  }

  deleteVolume(id: string): boolean {
    const idx = this.volumes.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const vol = this.volumes[idx];
    const pool = this.pools.find((p) => p.id === vol.poolId);
    if (pool) pool.volumeCount--;
    this.volumes.splice(idx, 1);
    return true;
  }

  acknowledgeAlert(id: string): Alert | undefined {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return undefined;
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    return alert;
  }

  destroy(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }
}
