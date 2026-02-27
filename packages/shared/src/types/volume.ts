export type VolumeStatus = 'online' | 'offline' | 'degraded';

export interface Volume {
  id: string;
  name: string;
  status: VolumeStatus;
  capacityBytes: number;
  usedBytes: number;
  poolId: string;
  poolName: string;
  hostMappings: string[];
  ioGroupId: string;
  tieringPolicy: 'auto' | 'none';
  compressed: boolean;
  createdAt: string;
  reductionRatio?: number;
  raidLevel?: string;
}

export interface CreateVolumeRequest {
  name: string;
  capacityBytes: number;
  poolId: string;
  tieringPolicy?: 'auto' | 'none';
  compressed?: boolean;
}
