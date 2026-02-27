export interface PerformanceDataPoint {
  timestamp: string;
  readIOPS: number;
  writeIOPS: number;
  readThroughputMBs: number;
  writeThroughputMBs: number;
  readLatencyMs: number;
  writeLatencyMs: number;
}

export interface MetadataDataPoint {
  timestamp: string;
  creates: number;
  removes: number;
  lookups: number;
  setMix: number;
}

export interface PerformanceSummary {
  currentIOPS: number;
  currentThroughputMBs: number;
  currentLatencyMs: number;
  history: PerformanceDataPoint[];
  metadataHistory?: MetadataDataPoint[];
}
