import type { Pool, PoolStatus } from '@vdura/shared';
import {
  parseColumnOutput,
  parseKeyValueOutput,
  parseCapacity,
  nameToId,
  mapPoolStatus,
  safeInt,
} from './column-parser.js';

/**
 * Parse `bladeset list allcolumns` output into Pool[].
 * Expected columns vary by firmware, but typically include:
 *   Name  Status  Capacity  Used  Available  Volumes  VPODs  VPODs Online  Drives  ...
 */
export function parseBladesetList(raw: string): Pool[] {
  const rows = parseColumnOutput(raw);
  const pools: Pool[] = [];

  for (const row of rows) {
    try {
      const name = row['Name'] ?? row['BladeSet'] ?? row['Bladeset'] ?? '';
      if (!name) continue;

      const totalCapacity = parseCapacity(row['Capacity'] ?? row['Total Capacity'] ?? '0');
      const usedCapacity = parseCapacity(row['Used'] ?? row['Used Capacity'] ?? '0');
      const availableCapacity = parseCapacity(row['Available'] ?? row['Available Capacity'] ?? row['Free'] ?? '0');

      const pool: Pool = {
        id: nameToId('pool', name),
        name: nameToId('pool', name),
        displayName: name,
        status: mapPoolStatus(row['Status'] ?? 'online'),
        totalCapacityBytes: totalCapacity,
        usedCapacityBytes: usedCapacity,
        availableCapacityBytes: availableCapacity || (totalCapacity - usedCapacity),
        volumeCount: safeInt(row['Volumes'] ?? row['Volume Count']),
        driveCount: safeInt(row['Drives'] ?? row['Drive Count']),
        raidLevel: row['RAID Level'] ?? row['RAID'] ?? row['Layout'] ?? 'unknown',
        tier: inferTier(name, row['Type'] ?? row['Tier'] ?? ''),
        vpodCount: safeInt(row['VPODs'] ?? row['VPOD Count']),
        vpodsOnline: safeInt(row['VPODs Online']),
        compatibilityClass: row['Compatibility Class'] ?? row['Class'] ?? undefined,
        nodeCount: safeInt(row['Nodes'] ?? row['Node Count']) || undefined,
      };

      pools.push(pool);
    } catch (err) {
      console.warn('[v5000] Failed to parse bladeset row:', err);
    }
  }

  return pools;
}

/**
 * Parse `bladeset detail <name>` output for additional metadata.
 */
export function parseBladesetDetail(raw: string): Partial<Pool> {
  const kv = parseKeyValueOutput(raw);

  const result: Partial<Pool> = {};

  if (kv['Capacity'] || kv['Total Capacity']) {
    result.totalCapacityBytes = parseCapacity(kv['Capacity'] ?? kv['Total Capacity'] ?? '');
  }
  if (kv['Used'] || kv['Used Capacity']) {
    result.usedCapacityBytes = parseCapacity(kv['Used'] ?? kv['Used Capacity'] ?? '');
  }
  if (kv['RAID Level'] || kv['RAID Config'] || kv['RAID']) {
    result.raidLevel = kv['RAID Level'] ?? kv['RAID Config'] ?? kv['RAID'] ?? undefined;
    result.raidConfig = kv['RAID Config'] ?? kv['RAID Level'] ?? undefined;
  }
  if (kv['Status']) {
    result.status = mapPoolStatus(kv['Status']);
  }
  if (kv['Metadata Used']) {
    result.metadataUsedBytes = parseCapacity(kv['Metadata Used']);
  }
  if (kv['Metadata Total'] || kv['Metadata Capacity']) {
    result.metadataTotalBytes = parseCapacity(kv['Metadata Total'] ?? kv['Metadata Capacity'] ?? '');
  }
  if (kv['Drives'] || kv['Drive Count']) {
    result.driveCount = safeInt(kv['Drives'] ?? kv['Drive Count']);
  }
  if (kv['Nodes'] || kv['Node Count']) {
    result.nodeCount = safeInt(kv['Nodes'] ?? kv['Node Count']) || undefined;
  }

  return result;
}

function inferTier(name: string, typeStr: string): 'ssd' | 'nearline' | 'hybrid' {
  const combined = `${name} ${typeStr}`.toLowerCase();
  if (combined.includes('ssd') || combined.includes('flash') || combined.includes('nvme')) return 'ssd';
  if (combined.includes('nearline') || combined.includes('nl') || combined.includes('archive')) return 'nearline';
  if (combined.includes('hybrid') || combined.includes('mix')) return 'hybrid';
  return 'ssd'; // default
}
