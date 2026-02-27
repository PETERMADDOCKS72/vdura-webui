export type NodeStatus = 'online' | 'offline' | 'service';
export type NodeRole = 'director' | 'storage';

export interface SystemNode {
  id: string;
  name: string;
  status: NodeStatus;
  serialNumber: string;
  firmwareVersion: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  role?: NodeRole;
  ipAddress?: string;
  model?: string;
  poolId?: string;
  poolName?: string;
  dataSpaceBytes?: number;
  dataSpaceTotalBytes?: number;
  metadataSpaceBytes?: number;
  metadataSpaceTotalBytes?: number;
}

export interface SystemInfo {
  clusterName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  totalRawCapacityBytes: number;
  totalUsableCapacityBytes: number;
  totalUsedCapacityBytes: number;
  nodeCount: number;
  nodes: SystemNode[];
  uptimeSeconds: number;
  directorNodeCount?: number;
  storageNodeCount?: number;
}
