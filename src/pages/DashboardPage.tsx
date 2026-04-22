import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { DashboardResponse } from '@/types/api';
import {
  Activity,
  ArrowRight,
  DollarSign,
  Layers3,
  Loader2,
  PlayCircle,
  Upload,
  Users,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardResponse>('/api/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Failed to load dashboard.</div>;
  }

  const activeRuns = data.recentRuns.filter((run) => run.status === 'queuing' || run.status === 'processing').length;
  const stats = [
    { label: 'Total Lists', value: data.totalLists.toLocaleString(), icon: Layers3, tone: 'text-sky-300' },
    { label: 'Total Contacts', value: data.totalContacts.toLocaleString(), icon: Users, tone: 'text-primary' },
    { label: 'Monthly Spend', value: `$${parseFloat(data.monthlyCostUsd).toFixed(2)}`, icon: DollarSign, tone: 'text-amber-300' },
    { label: 'Active Runs', value: activeRuns.toLocaleString(), icon: Activity, tone: 'text-violet-300' },
  ];

  return (
    <div className="min-h-full animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Operations</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Pipeline Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/lists" className="btn-outline btn-md">
            <Users className="h-4 w-4" />
            Contacts
          </Link>
          <Link to="/import" className="btn-primary btn-md">
            <Upload className="h-4 w-4" />
            Import CSV
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="metric">
            <div className="flex items-center justify-between gap-3">
              <span className="kbd-label">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.tone}`} />
            </div>
            <div className="mt-4 text-3xl font-black tabular-nums text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="px-6 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-foreground">Recent Runs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest enrichment activity across all lists.</p>
          </div>
          <Link to="/lists" className="btn-ghost btn-sm">
            View Lists
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentRuns.length === 0 ? (
          <div className="empty-state">
            <PlayCircle className="h-9 w-9 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-black text-foreground">No runs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Import contacts and start an enrichment run.</p>
            <Link to="/import" className="btn-primary btn-md mt-5">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </div>
        ) : (
          <div className="table-shell">
            <div className="table-scroll max-h-[calc(100vh-22rem)]">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lead List</th>
                    <th>Status</th>
                    <th className="text-right">Progress</th>
                    <th className="text-right">Cost</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRuns.map((run) => {
                    const accounted = run.completedItems + run.failedItems + run.skippedItems;
                    const progress = run.totalItems > 0 ? (accounted / run.totalItems) * 100 : 0;
                    return (
                      <tr key={run.id} className="cursor-pointer" onClick={() => navigate(`/runs/${run.id}`)}>
                        <td>
                          <div className="font-semibold text-foreground">{run.listName}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">run_{run.id.slice(0, 8)}</div>
                        </td>
                        <td>
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="min-w-40 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="h-1 w-20 rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {accounted}/{run.totalItems}
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono text-sm">${parseFloat(run.totalCostUsd).toFixed(4)}</td>
                        <td className="text-sm text-muted-foreground">
                          {new Date(run.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
