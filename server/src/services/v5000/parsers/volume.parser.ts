import type { Volume, VolumeStatus } from '@vdura/shared';
import {
  parseColumnOutput,
  parseKeyValueOutput,
  parseCapacity,
  nameToId,
  mapVolumeStatus,
  safeFloat,
} from './column-parser.js';

/**
 * Parse `volume list allcolumns` output into Volume[].
 * Expected columns: Name  Status  Capacity  Used  BladeSet  Layout  Compressed  ...
 */
export function parseVolumeList(raw: string): Volume[] {
  const rows = parseColumnOutput(raw);
  const volumes: Volume[] = [];

  for (const row of rows) {
    try {
      const name = row['Name'] ?? row['Volume'] ?? '';
      if (!name) continue;

      const bladeset = row['BladeSet'] ?? row['Bladeset'] ?? row['Pool'] ?? '';

      const volume: Volume = {
        id: nameToId('vol', name),
        name,
        status: mapVolumeStatus(row['Status'] ?? 'online'),
        capacityBytes: parseCapacity(row['Capacity'] ?? row['Size'] ?? '0'),
        usedBytes: parseCapacity(row['Used'] ?? row['Used Capacity'] ?? '0'),
        poolId: bladeset ? nameToId('pool', bladeset) : '',
        poolName: bladeset,
        hostMappings: parseHostMappings(row['Host Mappings'] ?? row['Hosts'] ?? row['Mapped Hosts'] ?? ''),
        ioGroupId: row['IO Group'] ?? row['IOGroup'] ?? 'default',
        tieringPolicy: parseTieringPolicy(row['Tiering'] ?? row['Tiering Policy'] ?? ''),
        compressed: parseBoolean(row['Compressed'] ?? row['Compression'] ?? ''),
        createdAt: row['Created'] ?? row['Create Date'] ?? new Date().toISOString(),
        raidLevel: row['Layout'] ?? row['RAID Level'] ?? row['RAID'] ?? undefined,
        reductionRatio: safeFloat(row['Reduction Ratio'] ?? row['Data Reduction']) || undefined,
      };

      volumes.push(volume);
    } catch (err) {
      console.warn('[v5000] Failed to parse volume row:', err);
    }
  }

  return volumes;
}

/**
 * Parse `volume details <name>` output for enrichment.
 */
export function parseVolumeDetails(raw: string): Partial<Volume> {
  const kv = parseKeyValueOutput(raw);

  const result: Partial<Volume> = {};

  if (kv['Compressed'] || kv['Compression']) {
    result.compressed = parseBoolean(kv['Compressed'] ?? kv['Compression'] ?? '');
  }
  if (kv['Reduction Ratio'] || kv['Data Reduction']) {
    result.reductionRatio = safeFloat(kv['Reduction Ratio'] ?? kv['Data Reduction']) || undefined;
  }
  if (kv['Tiering'] || kv['Tiering Policy']) {
    result.tieringPolicy = parseTieringPolicy(kv['Tiering'] ?? kv['Tiering Policy'] ?? '');
  }
  if (kv['Status']) {
    result.status = mapVolumeStatus(kv['Status']);
  }
  if (kv['Capacity'] || kv['Size']) {
    result.capacityBytes = parseCapacity(kv['Capacity'] ?? kv['Size'] ?? '');
  }
  if (kv['Used'] || kv['Used Capacity']) {
    result.usedBytes = parseCapacity(kv['Used'] ?? kv['Used Capacity'] ?? '');
  }

  return result;
}

function parseHostMappings(str: string): string[] {
  if (!str || str === '-' || str.toLowerCase() === 'none') return [];
  return str.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

function parseTieringPolicy(str: string): 'auto' | 'none' {
  return str.toLowerCase().includes('auto') ? 'auto' : 'none';
}

function parseBoolean(str: string): boolean {
  const s = str.toLowerCase().trim();
  return s === 'yes' || s === 'true' || s === 'on' || s === 'enabled' || s === '1';
}
