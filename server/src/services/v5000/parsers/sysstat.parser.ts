import type { PerformanceDataPoint, MetadataDataPoint } from '@vdura/shared';
import { parseKeyValueOutput, safeFloat } from './column-parser.js';

/**
 * Parse `sysstat storage` output into a PerformanceDataPoint.
 * Expected key-value pairs like:
 *   Read IOPS: 12345
 *   Write IOPS: 4567
 *   Read Throughput (MB/s): 500
 *   Write Throughput (MB/s): 200
 *   Read Latency (ms): 0.4
 *   Write Latency (ms): 0.7
 */
export function parseSysstatStorage(raw: string): PerformanceDataPoint {
  const kv = parseKeyValueOutput(raw);

  return {
    timestamp: new Date().toISOString(),
    readIOPS: safeFloat(findValue(kv, ['Read IOPS', 'ReadIOPS', 'Read IO/s'])),
    writeIOPS: safeFloat(findValue(kv, ['Write IOPS', 'WriteIOPS', 'Write IO/s'])),
    readThroughputMBs: safeFloat(findValue(kv, [
      'Read Throughput (MB/s)', 'Read Throughput', 'ReadThroughput', 'Read BW',
    ])),
    writeThroughputMBs: safeFloat(findValue(kv, [
      'Write Throughput (MB/s)', 'Write Throughput', 'WriteThroughput', 'Write BW',
    ])),
    readLatencyMs: safeFloat(findValue(kv, [
      'Read Latency (ms)', 'Read Latency', 'ReadLatency', 'Read Lat',
    ])),
    writeLatencyMs: safeFloat(findValue(kv, [
      'Write Latency (ms)', 'Write Latency', 'WriteLatency', 'Write Lat',
    ])),
  };
}

/**
 * Parse `sysstat director` output into a MetadataDataPoint.
 * Expected key-value pairs like:
 *   Creates: 1200
 *   Removes: 800
 *   Lookups: 5000
 *   SetMix: 2200
 */
export function parseSysstatDirector(raw: string): MetadataDataPoint {
  const kv = parseKeyValueOutput(raw);

  return {
    timestamp: new Date().toISOString(),
    creates: safeFloat(findValue(kv, ['Creates', 'Create Ops', 'CreateOps'])),
    removes: safeFloat(findValue(kv, ['Removes', 'Remove Ops', 'RemoveOps', 'Deletes'])),
    lookups: safeFloat(findValue(kv, ['Lookups', 'Lookup Ops', 'LookupOps'])),
    setMix: safeFloat(findValue(kv, ['SetMix', 'Set Mix', 'SetMixOps', 'Mixed Ops'])),
  };
}

/**
 * Look up a value using multiple possible key names (firmware version tolerance).
 */
function findValue(kv: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (kv[key] !== undefined) return kv[key];
  }
  // Try case-insensitive match
  const kvLower = Object.fromEntries(
    Object.entries(kv).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    if (kvLower[key.toLowerCase()] !== undefined) return kvLower[key.toLowerCase()];
  }
  return undefined;
}
