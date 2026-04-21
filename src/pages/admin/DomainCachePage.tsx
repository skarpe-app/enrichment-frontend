import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminDomainRow, PaginatedResponse } from '@/types/api';
import { Search, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export function DomainCachePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'domains', page, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (search) params.set('q', search);
      return apiFetch<PaginatedResponse<AdminDomainRow>>(`/api/admin/domains?${params}`);
    },
  });

  const invalidate = useMutation({
    mutationFn: (domain: string) =>
      apiFetch(`/api/admin/domains/${domain}/invalidate`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] }),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Domain Cache</h1>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search domains..."
            className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground" />
        </div>
        <button type="submit" className="rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/80">Search</button>
      </form>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
          {search ? 'No domains match your search.' : 'No cached domains yet.'}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Domain</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">DNS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Latest Snapshot</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Classifications</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((d) => (
                  <tr key={d.domain} className="border-b border-border">
                    <td className="px-4 py-2.5 text-sm font-mono text-foreground">{d.domain}</td>
                    <td className="px-4 py-2.5">
                      {d.dnsValid === null ? (
                        <span className="text-xs text-muted-foreground">-</span>
                      ) : d.dnsValid ? (
                        <span className="text-xs text-green-400">Valid</span>
                      ) : (
                        <span className="text-xs text-red-400">Failed</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      {d.latestSnapshotAt ? new Date(d.latestSnapshotAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{d.classificationsCount}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => { if (confirm(`Invalidate all snapshots for ${d.domain}?`)) invalidate.mutate(d.domain); }}
                        className="text-muted-foreground hover:text-foreground" title="Invalidate">
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page {page} of {data.pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
