export type PoolStatus = 'online' | 'offline' | 'degraded';

export interface Pool {
  id: string;
  name: string;
  status: PoolStatus;
  totalCapacityBytes: number;
  usedCapacityBytes: number;
  availableCapacityBytes: number;
  volumeCount: number;
  driveCount: number;
  raidLevel: string;
  tier: 'ssd' | 'nearline' | 'hybrid';
}
