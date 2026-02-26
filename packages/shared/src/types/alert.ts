export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  source: string;
  timestamp: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}
