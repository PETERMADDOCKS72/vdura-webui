export type NodeStatus = 'online' | 'offline' | 'service';

export interface SystemNode {
  id: string;
  name: string;
  status: NodeStatus;
  serialNumber: string;
  firmwareVersion: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
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
}
