import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils';

interface CapacityBarProps {
  used: number;
  total: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function CapacityBar({ used, total, className, showLabel = true, size = 'md' }: CapacityBarProps) {
  const percent = total > 0 ? (used / total) * 100 : 0;
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2.5';
  // Amber for normal, red when critical
  const barColor = percent > 90 ? 'bg-vdura-error' : 'bg-vdura-amber';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatBytes(used)} / {formatBytes(total)}</span>
          <span>{percent.toFixed(1)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-vdura-surface-raised', barHeight)}>
        <div
          className={cn('rounded-full transition-all', barHeight, barColor)}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
