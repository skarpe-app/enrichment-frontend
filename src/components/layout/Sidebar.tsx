import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import type { SettingsResponse } from '@/types/api';
import {
  LayoutDashboard,
  List,
  Upload,
  Settings,
  Globe,
  Radio,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lists', label: 'Contact Lists', icon: List },
  { to: '/import', label: 'Import CSV', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { to: '/admin/domains', label: 'Domain Cache', icon: Globe },
  { to: '/admin/proxies', label: 'Proxy Management', icon: Radio },
];

export function Sidebar() {
  const { isAuthenticated } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
    enabled: isAuthenticated,
  });
  const isAdmin = settings?.profile.role === 'ADMIN';

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-semibold text-foreground">Enrichment</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {/* Admin section — only visible to admins */}
        {isAdmin && (
          <>
        <div className="my-4 border-t border-border" />
        <div className="px-3 py-1 text-xs font-medium uppercase text-muted-foreground">
          Admin
        </div>
        {adminItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
          </>
        )}
      </nav>
    </aside>
  );
}
