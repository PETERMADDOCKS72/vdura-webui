import type { SystemNode, NodeRole, NodeStatus } from '@vdura/shared';
import {
  parseColumnOutput,
  nameToId,
  mapNodeStatus,
  parseCapacity,
  safeFloat,
} from './column-parser.js';

/**
 * Parse `sysmap nodes allcolumns` output into SystemNode[].
 * Expected columns: Name  Status  Serial  Firmware  Role  IP  Model  ...
 */
export function parseSysmapNodes(raw: string): SystemNode[] {
  const rows = parseColumnOutput(raw);
  const nodes: SystemNode[] = [];

  for (const row of rows) {
    try {
      const name = row['Name'] ?? row['Node'] ?? '';
      if (!name) continue;

      const node: SystemNode = {
        id: nameToId('node', name),
        name,
        status: mapNodeStatus(row['Status'] ?? 'online'),
        serialNumber: row['Serial'] ?? row['Serial Number'] ?? '',
        firmwareVersion: row['Firmware'] ?? row['Firmware Version'] ?? row['Code Level'] ?? '',
        cpuUsagePercent: safeFloat(row['CPU Usage'] ?? row['CPU'] ?? row['CPU%']),
        memoryUsagePercent: safeFloat(row['Memory Usage'] ?? row['Memory'] ?? row['Mem%']),
        role: inferRole(row['Role'] ?? row['Type'] ?? name),
        ipAddress: row['IP'] ?? row['IP Address'] ?? row['Management IP'] ?? undefined,
        model: row['Model'] ?? row['Hardware'] ?? undefined,
        poolId: row['BladeSet'] ? nameToId('pool', row['BladeSet']) : undefined,
        poolName: row['BladeSet'] ?? row['Bladeset'] ?? undefined,
      };

      nodes.push(node);
    } catch (err) {
      console.warn('[v5000] Failed to parse sysmap node row:', err);
    }
  }

  return nodes;
}

/**
 * Parse `sysmap nodes storage capacity` output and return a map of
 * node name → capacity info for enrichment.
 */
export function parseSysmapCapacity(raw: string): Map<string, NodeCapacityInfo> {
  const rows = parseColumnOutput(raw);
  const result = new Map<string, NodeCapacityInfo>();

  for (const row of rows) {
    const name = row['Name'] ?? row['Node'] ?? '';
    if (!name) continue;

    try {
      result.set(name, {
        dataSpaceBytes: parseCapacity(row['Data Space'] ?? row['Data Used'] ?? '0'),
        dataSpaceTotalBytes: parseCapacity(row['Data Total'] ?? row['Data Capacity'] ?? '0'),
        metadataSpaceBytes: parseCapacity(row['Metadata Space'] ?? row['Metadata Used'] ?? '0'),
        metadataSpaceTotalBytes: parseCapacity(row['Metadata Total'] ?? row['Metadata Capacity'] ?? '0'),
      });
    } catch (err) {
      console.warn('[v5000] Failed to parse sysmap capacity row:', err);
    }
  }

  return result;
}

export interface NodeCapacityInfo {
  dataSpaceBytes: number;
  dataSpaceTotalBytes: number;
  metadataSpaceBytes: number;
  metadataSpaceTotalBytes: number;
}

/**
 * Enrich nodes with capacity data from a separate query.
 */
export function enrichNodesWithCapacity(
  nodes: SystemNode[],
  capacityMap: Map<string, NodeCapacityInfo>,
): SystemNode[] {
  return nodes.map((node) => {
    const cap = capacityMap.get(node.name);
    if (!cap) return node;
    return {
      ...node,
      dataSpaceBytes: cap.dataSpaceBytes,
      dataSpaceTotalBytes: cap.dataSpaceTotalBytes,
      metadataSpaceBytes: cap.metadataSpaceBytes,
      metadataSpaceTotalBytes: cap.metadataSpaceTotalBytes,
    };
  });
}

function inferRole(roleStr: string): NodeRole {
  const s = roleStr.toLowerCase();
  if (s.includes('director') || s.includes('dir') || s.includes('mgmt') || s.includes('management')) {
    return 'director';
  }
  return 'storage';
}
