export type HostStatus = 'online' | 'offline' | 'degraded';
export type HostType = 'iscsi' | 'fc';

export interface Host {
  id: string;
  name: string;
  status: HostStatus;
  type: HostType;
  wwpns: string[];
  iscsiNames: string[];
  mappedVolumes: string[];
  portCount: number;
}
