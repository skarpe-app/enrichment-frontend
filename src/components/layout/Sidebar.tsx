import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ComponentType } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import type { SettingsResponse } from '@/types/api';
import {
  Database,
  Gauge,
  Globe2,
  LogOut,
  Radio,
  Settings,
  Upload,
  UsersRound,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const primaryNav = [
  { to: '/lists', label: 'Contacts', icon: UsersRound },
  { to: '/dashboard', label: 'Pipeline Monitor', icon: Zap },
  { to: '/import', label: 'Import CSV', icon: Upload },
];

const utilityNav = [
  { to: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { to: '/admin/domains', label: 'Domain Cache', icon: Globe2 },
  { to: '/admin/proxies', label: 'Proxy Performance', icon: Radio },
];

export function Sidebar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
    enabled: isAuthenticated,
  });

  const isAdmin = settings?.profile.role === 'ADMIN';
  const profileName = settings?.profile.name || user?.email?.split('@')[0] || 'Workspace';
  const initials = (settings?.profile.name || settings?.profile.email || user?.email || 'QS')
    .split(/\s|@|\./)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <Database className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-black tracking-tight text-foreground">Quantum Scaling</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Contact Enrichment
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <NavGroup items={primaryNav} />

        <div className="mt-6 border-t border-border pt-4">
          <NavGroup items={utilityNav} />
        </div>

        {isAdmin && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Admin
            </div>
            <NavGroup items={adminNav} />
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-md border border-border bg-background p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-black text-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{profileName}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <NavLink to="/dashboard" className="btn-ghost btn-sm justify-start">
            <Gauge className="h-4 w-4" />
            Overview
          </NavLink>
          <button onClick={signOut} className="icon-btn" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ items }: { items: Array<{ to: string; label: string; icon: ComponentType<{ className?: string }> }> }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition-colors',
          isActive
            ? 'bg-accent text-primary'
            : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}
