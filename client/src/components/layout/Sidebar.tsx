import { NavLink } from 'react-router';
import {
  LayoutDashboard, HardDrive, Database, Server,
  Bell, Activity, Settings, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/volumes', icon: HardDrive, label: 'Volumes' },
  { to: '/pools', icon: Database, label: 'Pools' },
  { to: '/hosts', icon: Server, label: 'Hosts' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/performance', icon: Activity, label: 'Performance' },
  { to: '/system', icon: Settings, label: 'System' },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-sidebar-background transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {sidebarOpen && <span className="text-lg font-bold text-sidebar-primary">VDURA V5000</span>}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
