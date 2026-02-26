import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityConfig: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  critical: { icon: AlertOctagon, color: 'text-vdura-error' },
  warning: { icon: AlertTriangle, color: 'text-vdura-amber' },
  info: { icon: Info, color: 'text-blue-400' },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity] ?? severityConfig.info;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', config.color)}>
      <Icon className="h-4 w-4" />
      <span className="capitalize">{severity}</span>
    </span>
  );
}
