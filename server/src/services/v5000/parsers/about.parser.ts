import { parseKeyValueOutput } from './column-parser.js';

export interface AboutInfo {
  clusterName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  uptimeSeconds: number;
}

/**
 * Parse `about` command output into system metadata.
 * Expected key-value pairs like:
 *   System Name: MyCluster
 *   Model: V5000
 *   Serial Number: ABC123
 *   Code Level: 8.6.0.0
 *   Uptime: 45 days, 3:22:15
 */
export function parseAbout(raw: string): AboutInfo {
  const kv = parseKeyValueOutput(raw);

  return {
    clusterName: kv['System Name'] ?? kv['Cluster Name'] ?? kv['Name'] ?? 'Unknown',
    model: kv['Model'] ?? kv['Product Name'] ?? kv['Machine Type'] ?? 'VDURA V5000',
    serialNumber: kv['Serial Number'] ?? kv['Serial'] ?? '',
    firmwareVersion: kv['Code Level'] ?? kv['Firmware Version'] ?? kv['Firmware'] ?? kv['Version'] ?? '',
    uptimeSeconds: parseUptime(kv['Uptime'] ?? kv['System Uptime'] ?? ''),
  };
}

function parseUptime(str: string): number {
  if (!str) return 0;

  let totalSeconds = 0;

  // Match "X days" part
  const daysMatch = str.match(/(\d+)\s*days?/i);
  if (daysMatch) totalSeconds += parseInt(daysMatch[1], 10) * 86400;

  // Match "HH:MM:SS" part
  const timeMatch = str.match(/(\d+):(\d+):(\d+)/);
  if (timeMatch) {
    totalSeconds += parseInt(timeMatch[1], 10) * 3600;
    totalSeconds += parseInt(timeMatch[2], 10) * 60;
    totalSeconds += parseInt(timeMatch[3], 10);
  }

  // If just a raw number, treat as seconds
  if (totalSeconds === 0) {
    const num = parseInt(str, 10);
    if (!isNaN(num)) totalSeconds = num;
  }

  return totalSeconds;
}
