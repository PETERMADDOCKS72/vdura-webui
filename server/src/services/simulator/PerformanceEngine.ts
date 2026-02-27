import type { PerformanceDataPoint, MetadataDataPoint } from '@vdura/shared';

const MAX_HISTORY = 288; // 24h at 5-min intervals

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomWalk(prev: number, stepSize: number, min: number, max: number, meanTarget: number): number {
  const reversion = (meanTarget - prev) * 0.05;
  const noise = (Math.random() - 0.5) * stepSize;
  return clamp(prev + reversion + noise, min, max);
}

export class PerformanceEngine {
  private storageHistory: PerformanceDataPoint[] = [];
  private metadataHistory: MetadataDataPoint[] = [];

  constructor() {
    this.seedHistory();
  }

  private seedHistory(): void {
    const now = Date.now();
    const intervalMs = 5 * 60_000;

    let readIOPS = 10000;
    let writeIOPS = 4000;
    let readTP = 500;
    let writeTP = 200;
    let readLat = 0.4;
    let writeLat = 0.7;
    let creates = 1200;
    let removes = 800;
    let lookups = 5000;
    let setMix = 2200;

    for (let i = MAX_HISTORY - 1; i >= 0; i--) {
      const ts = new Date(now - i * intervalMs).toISOString();

      readIOPS = randomWalk(readIOPS, 800, 4000, 20000, 10000);
      writeIOPS = randomWalk(writeIOPS, 400, 1500, 8000, 4000);
      readTP = randomWalk(readTP, 50, 200, 900, 500);
      writeTP = randomWalk(writeTP, 30, 80, 400, 200);
      readLat = randomWalk(readLat, 0.08, 0.1, 1.2, 0.4);
      writeLat = randomWalk(writeLat, 0.1, 0.2, 1.8, 0.7);

      this.storageHistory.push({
        timestamp: ts,
        readIOPS: Math.round(readIOPS),
        writeIOPS: Math.round(writeIOPS),
        readThroughputMBs: Math.round(readTP),
        writeThroughputMBs: Math.round(writeTP),
        readLatencyMs: parseFloat(readLat.toFixed(2)),
        writeLatencyMs: parseFloat(writeLat.toFixed(2)),
      });

      creates = randomWalk(creates, 150, 400, 3000, 1200);
      removes = randomWalk(removes, 100, 200, 2000, 800);
      lookups = randomWalk(lookups, 500, 2000, 12000, 5000);
      setMix = randomWalk(setMix, 200, 800, 5000, 2200);

      this.metadataHistory.push({
        timestamp: ts,
        creates: Math.round(creates),
        removes: Math.round(removes),
        lookups: Math.round(lookups),
        setMix: Math.round(setMix),
      });
    }
  }

  tick(): void {
    const now = new Date().toISOString();
    const prevS = this.storageHistory[this.storageHistory.length - 1];
    const prevM = this.metadataHistory[this.metadataHistory.length - 1];

    this.storageHistory.push({
      timestamp: now,
      readIOPS: Math.round(randomWalk(prevS.readIOPS, 800, 4000, 20000, 10000)),
      writeIOPS: Math.round(randomWalk(prevS.writeIOPS, 400, 1500, 8000, 4000)),
      readThroughputMBs: Math.round(randomWalk(prevS.readThroughputMBs, 50, 200, 900, 500)),
      writeThroughputMBs: Math.round(randomWalk(prevS.writeThroughputMBs, 30, 80, 400, 200)),
      readLatencyMs: parseFloat(randomWalk(prevS.readLatencyMs, 0.08, 0.1, 1.2, 0.4).toFixed(2)),
      writeLatencyMs: parseFloat(randomWalk(prevS.writeLatencyMs, 0.1, 0.2, 1.8, 0.7).toFixed(2)),
    });

    this.metadataHistory.push({
      timestamp: now,
      creates: Math.round(randomWalk(prevM.creates, 150, 400, 3000, 1200)),
      removes: Math.round(randomWalk(prevM.removes, 100, 200, 2000, 800)),
      lookups: Math.round(randomWalk(prevM.lookups, 500, 2000, 12000, 5000)),
      setMix: Math.round(randomWalk(prevM.setMix, 200, 800, 5000, 2200)),
    });

    // Trim to window
    if (this.storageHistory.length > MAX_HISTORY) {
      this.storageHistory.splice(0, this.storageHistory.length - MAX_HISTORY);
    }
    if (this.metadataHistory.length > MAX_HISTORY) {
      this.metadataHistory.splice(0, this.metadataHistory.length - MAX_HISTORY);
    }
  }

  getStorageHistory(): PerformanceDataPoint[] {
    return this.storageHistory;
  }

  getMetadataHistory(): MetadataDataPoint[] {
    return this.metadataHistory;
  }

  getLatestStorage(): PerformanceDataPoint {
    return this.storageHistory[this.storageHistory.length - 1];
  }
}
