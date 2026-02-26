import type { Alert, AlertSeverity, AlertStatus } from '@vdura/shared';
import { parseTabOutput, nameToId } from './column-parser.js';

/**
 * Parse `eventlog -output tab -count 200` output into Alert[].
 * Tab-delimited columns typically: Sequence  Date  Time  Category  Message  Source  ...
 */
export function parseEventlog(raw: string): Alert[] {
  const rows = parseTabOutput(raw);
  const alerts: Alert[] = [];

  for (const row of rows) {
    try {
      const seq = row['Sequence'] ?? row['Seq'] ?? row['ID'] ?? '';
      const message = row['Message'] ?? row['Description'] ?? row['Event'] ?? '';
      if (!message) continue;

      const category = row['Category'] ?? row['Type'] ?? row['Severity'] ?? '';
      const dateStr = row['Date'] ?? '';
      const timeStr = row['Time'] ?? '';
      const timestamp = parseEventTimestamp(dateStr, timeStr);

      const alert: Alert = {
        id: nameToId('alert', seq || timestamp),
        severity: mapCategoryToSeverity(category),
        status: 'active' as AlertStatus,
        message,
        source: row['Source'] ?? row['Component'] ?? row['Node'] ?? 'system',
        timestamp,
      };

      alerts.push(alert);
    } catch (err) {
      console.warn('[v5000] Failed to parse eventlog row:', err);
    }
  }

  return alerts;
}

function mapCategoryToSeverity(category: string): AlertSeverity {
  const s = category.toLowerCase().trim();
  if (s.includes('critical') || s.includes('error') || s.includes('fatal')) return 'critical';
  if (s.includes('warning') || s.includes('warn')) return 'warning';
  // syschanges, adminaction, info, audit, etc.
  return 'info';
}

function parseEventTimestamp(date: string, time: string): string {
  if (!date && !time) return new Date().toISOString();

  const combined = `${date} ${time}`.trim();

  // Try parsing as-is
  const parsed = new Date(combined);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  // Try common PanCLI formats: MM/DD/YYYY HH:MM:SS
  const match = combined.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, month, day, year, hours, minutes, seconds] = match;
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hours), parseInt(minutes), parseInt(seconds),
    ).toISOString();
  }

  // Fallback
  return new Date().toISOString();
}
