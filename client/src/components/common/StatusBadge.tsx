import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, MinusCircle, XCircle } from 'lucide-react';

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  online: { icon: CheckCircle, color: 'text-vdura-green', label: 'Good' },
  good: { icon: CheckCircle, color: 'text-vdura-green', label: 'Good' },
  degraded: { icon: AlertTriangle, color: 'text-vdura-amber', label: 'Warning' },
  warning: { icon: AlertTriangle, color: 'text-vdura-amber', label: 'Warning' },
  offline: { icon: MinusCircle, color: 'text-muted-foreground', label: 'Offline' },
  error: { icon: XCircle, color: 'text-vdura-error', label: 'Error' },
  service: { icon: MinusCircle, color: 'text-blue-400', label: 'Service' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.offline;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', config.color, className)}>
      <Icon className="h-4 w-4" />
      <span>{label ?? config.label}</span>
    </span>
  );
}
