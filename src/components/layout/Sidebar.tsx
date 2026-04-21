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
  Sparkles,
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
  const { isAuthenticated, user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
    enabled: isAuthenticated,
  });
  const isAdmin = settings?.profile.role === 'ADMIN';

  const initials = (settings?.profile.name || settings?.profile.email || 'U')
    .split(/\s|@/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card/30 backdrop-blur-xl">
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground tracking-tight">Enrichment</div>
          <div className="text-xs text-muted-foreground">AI Classification</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="mb-1 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Workspace
        </div>
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {isAdmin && (
          <>
            <div className="mt-6 mb-1 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Admin
            </div>
            {adminItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User card */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 text-xs font-semibold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {settings?.profile.name || user?.email?.split('@')[0]}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 text-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <Icon className={cn('h-[18px] w-[18px] transition-colors', isActive ? 'text-primary' : '')} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
