import { Bell } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { data: alerts } = useAlerts({ status: 'active' });
  const activeCount = alerts?.length ?? 0;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {activeCount > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center bg-red-600 text-white border-0">
              {activeCount}
            </Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground">Admin</span>
      </div>
    </header>
  );
}
