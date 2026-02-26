import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-600 text-white border-red-600',
  warning: 'bg-amber-500 text-white border-amber-500',
  info: 'bg-blue-500 text-white border-blue-500',
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge className={cn(severityStyles[severity] ?? 'bg-gray-500 text-white')}>
      {severity}
    </Badge>
  );
}
