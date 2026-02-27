import type { Pool } from '@vdura/shared';
import {
  parseKeyValueOutput,
  parseCapacity,
  nameToId,
  mapPoolStatus,
  safeInt,
} from './column-parser.js';

/**
 * Parse `bladeset list allcolumns` output into Pool[].
 *
 * Real PanCLI output format (2-line header):
 *   BladeSet  BladeSet  OSDs  Spares            Total  Available  Status
 *   Name      ID              Avail/Request  Capacity   Capacity
 *   Set 1     1         12    2/2                0 MB       0 MB  12/12 OSDs online
 *            Capacity balancing in BladeSet "Set 1" is currently off.
 *            ...
 *   Displaying 1 out of 1 BladeSets in the System
 */
export function parseBladesetList(raw: string): Pool[] {
  const lines = raw.split('\n');
  const pools: Pool[] = [];

  // Find the header: look for a line containing "BladeSet" and "Status"
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/BladeSet/i.test(lines[i]) && /Status/i.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  // Data starts 2 lines after the first header line (multi-line header)
  const dataStart = headerIdx + 2;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip continuation/info lines (indented)
    if (/^\s{2,}/.test(line)) continue;
    // Skip footer lines
    if (/^Display(ed|ing)\s+\d+/i.test(trimmed)) continue;
    // Skip info lines
    if (/^(Vertical Parity|MLEC|OSD Capacit)/i.test(trimmed)) continue;

    // Parse the data line: fields separated by 2+ spaces
    // Format: "Set 1     1         12    2/2                0 MB       0 MB  12/12 OSDs online"
    const parts = trimmed.split(/\s{2,}/);
    if (parts.length < 4) continue;

    try {
      const name = parts[0]; // "Set 1"
      const id = parts[1];   // "1"
      const osds = parts[2]; // "12"
      const spares = parts[3]; // "2/2"

      // Capacity fields may have units - scan from end
      const statusStr = parts[parts.length - 1]; // "12/12 OSDs online"
      const availCapStr = parts.length > 5 ? parts[parts.length - 2] : '0'; // "0 MB"
      const totalCapStr = parts.length > 6 ? parts[parts.length - 3] : '0'; // "0 MB"

      const totalCapacity = parseCapacity(totalCapStr);
      const availableCapacity = parseCapacity(availCapStr);

      // Derive online status from the status string like "12/12 OSDs online"
      const onlineMatch = statusStr.match(/(\d+)\/(\d+)\s+OSDs?\s+online/i);
      const status = onlineMatch
        ? (parseInt(onlineMatch[1]) === parseInt(onlineMatch[2]) ? 'online' : 'degraded')
        : mapPoolStatus(statusStr);

      const pool: Pool = {
        id: nameToId('pool', name),
        name: nameToId('pool', name),
        displayName: name,
        status: status as 'online' | 'offline' | 'degraded',
        totalCapacityBytes: totalCapacity,
        usedCapacityBytes: totalCapacity - availableCapacity,
        availableCapacityBytes: availableCapacity,
        volumeCount: 0,
        driveCount: safeInt(osds),
        raidLevel: 'unknown',
        tier: 'ssd',
        vpodCount: onlineMatch ? safeInt(onlineMatch[2]) : 0,
        vpodsOnline: onlineMatch ? safeInt(onlineMatch[1]) : 0,
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
