import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

interface CapacityBarProps {
  used: number;
  total: number;
  className?: string;
  showLabel?: boolean;
}

export function CapacityBar({ used, total, className, showLabel = true }: CapacityBarProps) {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const color = percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBytes(used)} / {formatBytes(total)}</span>
          <span>{percent.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-secondary">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}
