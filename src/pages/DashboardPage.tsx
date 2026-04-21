import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { DashboardResponse } from '@/types/api';
import { List, Users, DollarSign, Activity } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardResponse>('/api/dashboard'),
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!data) return <div className="p-6 text-muted-foreground">Failed to load dashboard.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Lists', value: data.totalLists, icon: List, color: 'text-blue-400' },
          { label: 'Contacts', value: data.totalContacts.toLocaleString(), icon: Users, color: 'text-green-400' },
          { label: 'Monthly Cost', value: `$${parseFloat(data.monthlyCostUsd).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-400' },
          { label: 'Recent Runs', value: data.recentRuns.length, icon: Activity, color: 'text-purple-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent runs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Recent Runs</h2>
        {data.recentRuns.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
            No enrichment runs yet. Import a CSV and start enriching.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">List</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Items</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRuns.map((run) => (
                  <tr key={run.id} className="border-b border-border hover:bg-accent/30 cursor-pointer"
                    onClick={() => window.location.href = `/runs/${run.id}`}>
                    <td className="px-4 py-2.5 text-sm text-foreground">{run.listName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        run.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                        run.status === 'stopped' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">
                      {run.completedItems}/{run.totalItems}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">
                      ${parseFloat(run.totalCostUsd).toFixed(4)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
