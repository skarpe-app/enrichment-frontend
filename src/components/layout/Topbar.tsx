import { Link, useLocation, useParams } from 'react-router-dom';
import { Activity, ChevronRight, Command, LogOut, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const routeLabels: Array<[RegExp, string[]]> = [
  [/^\/dashboard$/, ['Pipeline Monitor']],
  [/^\/lists$/, ['Contacts']],
  [/^\/lists\/[^/]+$/, ['Contacts', 'List Detail']],
  [/^\/import$/, ['Import CSV']],
  [/^\/settings$/, ['Settings']],
  [/^\/runs\/[^/]+$/, ['Pipeline Monitor', 'Run Detail']],
  [/^\/admin\/domains$/, ['Admin', 'Domain Cache']],
  [/^\/admin\/proxies$/, ['Admin', 'Proxy Performance']],
];

export function Topbar() {
  const { pathname } = useLocation();
  const params = useParams();
  const { signOut } = useAuth();
  const labels = routeLabels.find(([pattern]) => pattern.test(pathname))?.[1] ?? ['Workspace'];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex min-w-0 items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <nav className="flex min-w-0 items-center gap-2 text-sm font-bold">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <span className={index === labels.length - 1 ? 'truncate text-foreground' : 'text-muted-foreground'}>
                {label}
              </span>
            </span>
          ))}
          {params.runId && (
            <span className="hidden font-mono text-xs text-muted-foreground md:inline">
              #{params.runId.slice(0, 8)}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:flex">
          <span>GPT-4.1-mini</span>
          <span className="text-border">/</span>
          <span>Background Mode</span>
        </div>
        <div className="mx-2 hidden h-6 w-px bg-border md:block" />
        <Link to="/settings" className="icon-btn" title="Settings" aria-label="Settings">
          <SlidersHorizontal className="h-4 w-4" />
        </Link>
        <button onClick={signOut} className="icon-btn" title="Sign out" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
