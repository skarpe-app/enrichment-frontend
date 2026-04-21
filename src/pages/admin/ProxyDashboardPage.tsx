import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminProxyDto } from '@/types/api';
import { Plus, Trash2, TestTube, Loader2, Radio, Check, X } from 'lucide-react';

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
      setShowAdd(false); setForm({ name: '', host: '', port: '', protocol: 'http' });
    },
  });

  const deleteProxy = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/proxies/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'proxies'] }),
  });

  const testProxy = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiFetch<{ success: boolean; responseMs?: number }>(`/api/admin/proxies/${id}/test`, { method: 'POST' });
      setTestResult((prev) => ({ ...prev, [id]: result }));
      return result;
    },
  });

  if (isLoading) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const proxies = data?.data ?? [];

  return (
    <div className="p-8 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Proxy Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure custom scraping proxies</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-md">
          <Plus className="h-4 w-4" /> Add Proxy
        </button>
      </div>

      {showAdd && (
        <div className="card p-4 space-y-3 animate-in">
          <div className="grid grid-cols-4 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input input-sm" />
            <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="Host" className="input input-sm" />
            <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="Port" type="number" className="input input-sm" />
            <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} className="input input-sm">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createProxy.mutate({ ...form, port: parseInt(form.port) })} disabled={!form.name || !form.host || !form.port} className="btn-primary btn-sm">
              <Check className="h-3.5 w-3.5" /> Create
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-outline btn-sm">Cancel</button>
          </div>
        </div>
      )}

      {proxies.length === 0 ? (
        <div className="card p-12 text-center">
          <Radio className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No proxies configured</p>
          <p className="text-xs text-muted-foreground mt-1">The enrichment pipeline will fall back to free + premium adapters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Success</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg ms</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Requests</th>
                <th className="px-5 py-3 w-24 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {proxies.map((proxy) => {
                const test = testResult[proxy.id];
                const successRate = proxy.totalRequests > 0 ? ((proxy.successCount / proxy.totalRequests) * 100).toFixed(0) : '—';
                return (
                  <tr key={proxy.id} className="table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{proxy.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground">{proxy.protocol}://{proxy.host}:{proxy.port}</td>
                    <td className="px-5 py-3.5">
                      {proxy.isActive ? (
                        <span className="badge-success">Active</span>
                      ) : (
                        <span className="badge-neutral">Disabled</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-foreground">{successRate}%</td>
                    <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">{proxy.avgResponseMs}ms</td>
                    <td className="px-5 py-3.5 text-right text-sm text-muted-foreground">{proxy.totalRequests}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => testProxy.mutate(proxy.id)} className="btn-ghost btn-sm" title="Test connection">
                          {testProxy.isPending && testProxy.variables === proxy.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : test ? (
                            test.success ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-red-400" />
                          ) : (
                            <TestTube className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${proxy.name}"?`)) deleteProxy.mutate(proxy.id); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
