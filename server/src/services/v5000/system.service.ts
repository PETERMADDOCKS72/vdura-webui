import type { SystemInfo } from '@vdura/shared';
import type { ISystemService } from '../types.js';
import type { SshClient } from './SshClient.js';
import type { Cache } from './Cache.js';
import { parseAbout } from './parsers/about.parser.js';
import { parseSysmapNodes, parseSysmapCapacity, enrichNodesWithCapacity } from './parsers/sysmap.parser.js';

const CACHE_KEY = 'system-info';

export class V5000SystemService implements ISystemService {
  constructor(
    private ssh: SshClient,
    private cache: Cache<SystemInfo>,
  ) {}

  async getInfo(): Promise<SystemInfo> {
    const cached = this.cache.get(CACHE_KEY);
    if (cached) return cached;

    const [aboutResult, nodesResult, capacityResult] = await Promise.all([
      this.ssh.execute('about'),
      this.ssh.execute('sysmap nodes allcolumns'),
      this.ssh.execute('sysmap nodes storage capacity'),
    ]);

    const about = parseAbout(aboutResult.output);
    const nodes = parseSysmapNodes(nodesResult.output);
    const capacityMap = parseSysmapCapacity(capacityResult.output);
    const enrichedNodes = enrichNodesWithCapacity(nodes, capacityMap);

    const directorNodes = enrichedNodes.filter((n) => n.role === 'director');
    const storageNodes = enrichedNodes.filter((n) => n.role === 'storage');

    const totalRaw = storageNodes.reduce((sum, n) => sum + (n.dataSpaceTotalBytes ?? 0), 0);
    const totalUsed = storageNodes.reduce((sum, n) => sum + (n.dataSpaceBytes ?? 0), 0);

    const info: SystemInfo = {
      clusterName: about.clusterName,
      model: about.model,
      serialNumber: about.serialNumber,
      firmwareVersion: about.firmwareVersion,
      totalRawCapacityBytes: totalRaw,
      totalUsableCapacityBytes: totalRaw, // approximation; usable ≈ raw for now
      totalUsedCapacityBytes: totalUsed,
      nodeCount: enrichedNodes.length,
      nodes: enrichedNodes,
      uptimeSeconds: about.uptimeSeconds,
      directorNodeCount: directorNodes.length,
      storageNodeCount: storageNodes.length,
    };

    this.cache.set(CACHE_KEY, info);
    return info;
  }
}
