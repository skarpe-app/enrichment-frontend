import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminProxyDto } from '@/types/api';
import { Check, Loader2, Plus, Radio, TestTube, Trash2, X } from 'lucide-react';

export function ProxyDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'proxies'],
    queryFn: () => apiFetch<{ data: AdminProxyDto[] }>('/api/admin/proxies'),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', host: '', port: '', protocol: 'http' });
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; responseMs?: number }>>({});

  const createProxy = useMutation({
    mutationFn: (body: unknown) => apiFetch('/api/admin/proxies', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'proxies'] });
      setShowAdd(false);
      setForm({ name: '', host: '', port: '', protocol: 'http' });
    },
  });

  const deleteProxy = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/proxies/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'proxies'] }),
  });

  const testProxy = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiFetch<{ success: boolean; responseMs?: number }>(`/api/admin/proxies/${id}/test`, { method: 'POST' });
      setTestResult((previous) => ({ ...previous, [id]: result }));
      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const proxies = data?.data ?? [];

  return (
    <div className="min-h-full animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Proxy Performance</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-md">
          <Plus className="h-4 w-4" />
          Add Proxy
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_9rem_10rem_auto]">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="input input-sm" />
            <input value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder="Host" className="input input-sm" />
            <input value={form.port} onChange={(event) => setForm({ ...form, port: event.target.value })} placeholder="Port" type="number" className="input input-sm" />
            <select value={form.protocol} onChange={(event) => setForm({ ...form, protocol: event.target.value })} className="input input-sm">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => createProxy.mutate({ ...form, port: parseInt(form.port) })}
                disabled={!form.name || !form.host || !form.port || createProxy.isPending}
                className="btn-primary btn-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Create
              </button>
              <button onClick={() => setShowAdd(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {proxies.length === 0 ? (
          <div className="empty-state">
            <Radio className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-black text-foreground">No proxies configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">The pipeline will use configured adapter fallbacks.</p>
          </div>
        ) : (
          <div className="table-shell">
            <div className="table-scroll max-h-[calc(100vh-13rem)]">
              <table className="data-table min-w-[1050px]">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th className="text-right">Success</th>
                    <th className="text-right">Avg ms</th>
                    <th className="text-right">Requests</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proxies.map((proxy) => {
                    const test = testResult[proxy.id];
                    const successRate = proxy.totalRequests > 0 ? ((proxy.successCount / proxy.totalRequests) * 100).toFixed(0) : '-';
                    return (
                      <tr key={proxy.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                              <Radio className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-foreground">{proxy.name}</span>
                          </div>
                        </td>
                        <td className="font-mono text-sm text-muted-foreground">{proxy.protocol}://{proxy.host}:{proxy.port}</td>
                        <td>{proxy.isActive ? <span className="badge-success">Active</span> : <span className="badge-neutral">Disabled</span>}</td>
                        <td className="text-right font-mono">{successRate}%</td>
                        <td className="text-right font-mono text-muted-foreground">{proxy.avgResponseMs}ms</td>
                        <td className="text-right font-mono text-muted-foreground">{proxy.totalRequests.toLocaleString()}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => testProxy.mutate(proxy.id)} className="icon-btn" title="Test connection" aria-label={`Test ${proxy.name}`}>
                              {testProxy.isPending && testProxy.variables === proxy.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : test ? (
                                test.success ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-red-400" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${proxy.name}"?`)) deleteProxy.mutate(proxy.id);
                              }}
                              className="icon-btn hover:text-destructive"
                              title="Delete proxy"
                              aria-label={`Delete ${proxy.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
