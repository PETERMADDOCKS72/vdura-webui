import type { Volume } from '@vdura/shared';
import {
  parseKeyValueOutput,
  parseCapacity,
  nameToId,
  mapVolumeStatus,
  safeFloat,
} from './column-parser.js';

/**
 * Parse `volume list` output into Volume[].
 *
 * Real PanCLI output format (2-line header):
 *                                              Space    Soft     Hard
 *   Volume              BladeSet  RAID            Used   Quota    Quota  Status
 *   /                   Set 1     Object RAID6+   0 MB  524 MB   524 MB  Not accessible
 *   /home               Set 1     Object RAID6+   0 MB      --       --  Not accessible
 *   Displayed 50 out of 502 volumes in the system.
 */
export function parseVolumeList(raw: string): Volume[] {
  const lines = raw.split('\n');
  const volumes: Volume[] = [];

  // Find the header line that starts with "Volume"
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*Volume\s+/.test(lines[i]) && /Status/i.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  // Detect column positions from the header line
  const headerLine = lines[headerIdx];
  const columns = detectVolumeColumns(headerLine);

  // Parse data lines (after the header)
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip footer
    if (/^Display(ed|ing)\s+\d+/i.test(trimmed)) continue;
    // Volume names start with /
    if (!trimmed.startsWith('/')) continue;

    try {
      const fields = extractFields(line, columns);
      const name = fields.volume;
      if (!name) continue;

      const bladeset = fields.bladeset;
      const raidLevel = fields.raid;
      const usedStr = fields.used;
      const hardQuotaStr = fields.hardQuota;
      const statusStr = fields.status;

      const volume: Volume = {
        id: nameToId('vol', name),
        name,
        status: mapVolumeStatus(statusStr),
        capacityBytes: parseCapacity(hardQuotaStr),
        usedBytes: parseCapacity(usedStr),
        poolId: bladeset ? nameToId('pool', bladeset) : '',
        poolName: bladeset,
        hostMappings: [],
        ioGroupId: 'default',
        tieringPolicy: 'none',
        compressed: false,
        createdAt: new Date().toISOString(),
        raidLevel: raidLevel || undefined,
      };

      volumes.push(volume);
    } catch (err) {
      console.warn('[v5000] Failed to parse volume row:', err);
    }
  }

  return volumes;
}

interface VolumeColumns {
  volumeEnd: number;
  bladesetEnd: number;
  raidEnd: number;
  usedEnd: number;
  softQuotaEnd: number;
  hardQuotaEnd: number;
}

function detectVolumeColumns(headerLine: string): VolumeColumns {
  // Find the start positions of each column header
  const bladesetStart = headerLine.indexOf('BladeSet');
  const raidStart = headerLine.indexOf('RAID');
  const statusStart = headerLine.lastIndexOf('Status');

  // Work backwards from Status to find quota/used columns
  // Header: "Volume              BladeSet  RAID            Used   Quota    Quota  Status"
  const usedMatch = headerLine.match(/Used/);
  const usedPos = usedMatch ? headerLine.indexOf('Used') : -1;

  // Find "Quota" positions (there are two - Soft Quota and Hard Quota)
  const firstQuota = headerLine.indexOf('Quota');
  const secondQuota = headerLine.indexOf('Quota', firstQuota + 1);

  return {
    volumeEnd: bladesetStart > 0 ? bladesetStart : 20,
    bladesetEnd: raidStart > 0 ? raidStart : 30,
    raidEnd: usedPos > 0 ? usedPos - 2 : 46,
    usedEnd: firstQuota > 0 ? firstQuota - 1 : 52,
    softQuotaEnd: secondQuota > 0 ? secondQuota - 1 : 60,
    hardQuotaEnd: statusStart > 0 ? statusStart : 68,
  };
}

interface VolumeFields {
  volume: string;
  bladeset: string;
  raid: string;
  used: string;
  softQuota: string;
  hardQuota: string;
  status: string;
}

function extractFields(line: string, cols: VolumeColumns): VolumeFields {
  return {
    volume: line.substring(0, cols.volumeEnd).trim(),
    bladeset: line.substring(cols.volumeEnd, cols.bladesetEnd).trim(),
    raid: line.substring(cols.bladesetEnd, cols.raidEnd).trim(),
    used: line.substring(cols.raidEnd, cols.usedEnd).trim(),
    softQuota: line.substring(cols.usedEnd, cols.softQuotaEnd).trim(),
    hardQuota: line.substring(cols.softQuotaEnd, cols.hardQuotaEnd).trim(),
    status: line.substring(cols.hardQuotaEnd).trim(),
  };
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

function parseBoolean(str: string): boolean {
  const s = str.toLowerCase().trim();
  return s === 'yes' || s === 'true' || s === 'on' || s === 'enabled' || s === '1';
}
