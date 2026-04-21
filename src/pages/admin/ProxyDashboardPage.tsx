import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminProxyDto } from '@/types/api';
import { Plus, Trash2, TestTube, Power } from 'lucide-react';

export function ProxyDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'proxies'],
    queryFn: () => apiFetch<{ data: AdminProxyDto[] }>('/api/admin/proxies'),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', host: '', port: '', protocol: 'http' });
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; responseMs?: number; error?: string }>>({});

  const createProxy = useMutation({
    mutationFn: (body: unknown) => apiFetch('/api/admin/proxies', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'proxies'] }); setShowAdd(false); setForm({ name: '', host: '', port: '', protocol: 'http' }); },
  });

  const deleteProxy = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/admin/proxies/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'proxies'] }),
  });

  const testProxy = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiFetch<{ success: boolean; httpStatus?: number; responseMs?: number; error?: string }>(`/api/admin/proxies/${id}/test`, { method: 'POST' });
      setTestResult((prev) => ({ ...prev, [id]: result }));
      return result;
    },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const proxies = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Proxy Management</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Proxy
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
            <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="Host" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
            <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="Port" type="number" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
            <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })} className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createProxy.mutate({ ...form, port: parseInt(form.port) })} disabled={!form.name || !form.host || !form.port} className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Create</button>
            <button onClick={() => setShowAdd(false)} className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground">Cancel</button>
          </div>
        </div>
      )}

      {proxies.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          No proxies configured. Add one above.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Host:Port</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Protocol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Requests</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Success</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Avg ms</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {proxies.map((proxy) => {
                const test = testResult[proxy.id];
                const successRate = proxy.totalRequests > 0 ? ((proxy.successCount / proxy.totalRequests) * 100).toFixed(0) : '-';
                return (
                  <tr key={proxy.id} className="border-b border-border">
                    <td className="px-4 py-2.5 text-sm text-foreground">{proxy.name}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground">{proxy.host}:{proxy.port}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{proxy.protocol}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs ${proxy.isActive ? 'text-green-400' : 'text-muted-foreground'}`}>
                        <Power className="h-3 w-3" /> {proxy.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{proxy.totalRequests}</td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{successRate}%</td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{proxy.avgResponseMs}ms</td>
                    <td className="px-4 py-2.5 flex gap-2 justify-end">
                      <button onClick={() => testProxy.mutate(proxy.id)} className="text-muted-foreground hover:text-foreground" title="Test">
                        <TestTube className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${proxy.name}"?`)) deleteProxy.mutate(proxy.id); }} className="text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
