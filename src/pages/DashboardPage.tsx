import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { DashboardResponse } from '@/types/api';
import { List, Users, DollarSign, Activity, ArrowRight, Upload, Loader2 } from 'lucide-react';
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
  if (!data) return <div className="p-8 text-muted-foreground">Failed to load dashboard.</div>;

  const stats = [
    { label: 'Total Lists', value: data.totalLists, icon: List, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
    { label: 'Total Contacts', value: data.totalContacts.toLocaleString(), icon: Users, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400' },
    { label: 'Monthly Spend', value: `$${parseFloat(data.monthlyCostUsd).toFixed(2)}`, icon: DollarSign, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400' },
    { label: 'Recent Runs', value: data.recentRuns.length, icon: Activity, color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your enrichment activity</p>
        </div>
        <Link to="/import" className="btn-primary btn-md">
          <Upload className="h-4 w-4" />
          Import CSV
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`card-hover relative overflow-hidden p-5`}>
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${s.color} opacity-60 blur-2xl`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent runs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Runs</h2>
          <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.recentRuns.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No enrichment runs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Import a CSV and start enriching your contacts</p>
            <Link to="/import" className="btn-primary btn-md mt-5 inline-flex">
              <Upload className="h-4 w-4" /> Import your first list
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">List</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Started</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRuns.map((run) => {
                  const progress = run.totalItems > 0
                    ? ((run.completedItems + run.failedItems + run.skippedItems) / run.totalItems * 100).toFixed(0)
                    : '0';
                  return (
                    <tr
                      key={run.id}
                      className="table-row-hover cursor-pointer"
                      onClick={() => navigate(`/runs/${run.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-foreground">{run.listName}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="text-sm text-foreground">
                          {run.completedItems}/{run.totalItems}
                        </div>
                        <div className="text-xs text-muted-foreground">{progress}%</div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-foreground">
                        ${parseFloat(run.totalCostUsd).toFixed(4)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
