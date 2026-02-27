import type { Alert, AlertSeverity, AlertStatus } from '@vdura/shared';
import { parseTabOutput, nameToId } from './column-parser.js';

/**
 * Parse `eventlog -output tab -count 200` output into Alert[].
 *
 * Real PanCLI tab-delimited format:
 *   CODE\tCATEGORY\tTIME\tUSER_NAME\tCOMPONENT\tCOMPONENT_TYPE\tNODE_SERIAL\tENCLOSURE\tHARDWARE_SERIAL\tIP_ADDRESS\tBLADESET\tVOLUME_SERVICE\tVOLUME\tMESSAGE
 *   8523\tCritical\t2026-02-26T21:05:22Z\t\t\tVolume\t\t\t\t\tSet 1\t0x040...\t/ssali-test-vol196\tVolume down: ...
 */
export function parseEventlog(raw: string): Alert[] {
  const rows = parseTabOutput(raw);
  const alerts: Alert[] = [];

  for (const row of rows) {
    try {
      // Map from actual PanCLI tab header names
      const code = row['CODE'] ?? row['Code'] ?? row['Sequence'] ?? row['Seq'] ?? row['ID'] ?? '';
      const message = row['MESSAGE'] ?? row['Message'] ?? row['Description'] ?? '';
      if (!message) continue;

      const category = row['CATEGORY'] ?? row['Category'] ?? row['Type'] ?? row['Severity'] ?? '';
      const timeStr = row['TIME'] ?? row['Time'] ?? '';
      const timestamp = parseEventTimestamp(timeStr);

      const component = row['COMPONENT'] ?? row['Component'] ?? '';
      const componentType = row['COMPONENT_TYPE'] ?? row['Component_Type'] ?? '';
      const ipAddress = row['IP_ADDRESS'] ?? row['IP Address'] ?? '';
      const volume = row['VOLUME'] ?? row['Volume'] ?? '';

      // Build a descriptive source
      const sourceParts = [componentType, component, ipAddress, volume]
        .filter(Boolean)
        .filter((s) => s !== '-');
      const source = sourceParts.length > 0 ? sourceParts.join(' ') : 'system';

      const alert: Alert = {
        id: nameToId('alert', `${code}-${timestamp}`),
        severity: mapCategoryToSeverity(category),
        status: 'active' as AlertStatus,
        message,
        source,
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
  return 'info';
}

function parseEventTimestamp(timeStr: string): string {
  if (!timeStr) return new Date().toISOString();

  // PanCLI tab output uses ISO 8601: "2026-02-26T21:05:22Z"
  const parsed = new Date(timeStr);
  if (!isNaN(parsed.getTime())) return parsed.toISOString();

  // Try common PanCLI formats: "2026-02-26 16:07:12 EST"
  const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
  if (match) {
    const parsed2 = new Date(`${match[1]}T${match[2]}Z`);
    if (!isNaN(parsed2.getTime())) return parsed2.toISOString();
  }

  // Try MM/DD/YYYY HH:MM:SS format
  const usMatch = timeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (usMatch) {
    const [, month, day, year, hours, minutes, seconds] = usMatch;
    return new Date(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hours), parseInt(minutes), parseInt(seconds),
    ).toISOString();
  }

  return new Date().toISOString();
}
