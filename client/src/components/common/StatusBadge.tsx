import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  online: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  offline: 'bg-red-100 text-red-800 border-red-200',
  degraded: 'bg-amber-100 text-amber-800 border-amber-200',
  service: 'bg-blue-100 text-blue-800 border-blue-200',
  active: 'bg-red-100 text-red-800 border-red-200',
  acknowledged: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status] ?? 'bg-gray-100 text-gray-800')}>
      {status}
    </Badge>
  );
}
