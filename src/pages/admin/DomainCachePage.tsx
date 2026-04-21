import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminDomainRow, PaginatedResponse } from '@/types/api';
import { Search, RefreshCcw, ChevronLeft, ChevronRight, Loader2, Globe } from 'lucide-react';

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
    mutationFn: (domain: string) => apiFetch(`/api/admin/domains/${domain}/invalidate`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] }),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="p-8 space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Domain Cache</h1>
        <p className="mt-1 text-sm text-muted-foreground">Browse cached domain snapshots and classifications</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search domains..." className="input pl-9" />
        </div>
        <button type="submit" className="btn-secondary btn-md">Search</button>
      </form>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data?.data.length ? (
        <div className="card p-12 text-center">
          <Globe className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {search ? 'No domains match your search.' : 'No cached domains yet. Run an enrichment to populate the cache.'}
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">DNS</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Snapshot</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Classifications</th>
                  <th className="px-5 py-3 w-10"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((d) => (
                  <tr key={d.domain} className="table-row-hover">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-mono text-foreground">{d.domain}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.dnsValid === null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : d.dnsValid ? (
                        <span className="badge-success">Valid</span>
                      ) : (
                        <span className="badge-danger">Failed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {d.latestSnapshotAt ? new Date(d.latestSnapshotAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-foreground">{d.classificationsCount}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => { if (confirm(`Invalidate all snapshots for ${d.domain}?`)) invalidate.mutate(d.domain); }}
                        className="btn-ghost btn-sm" title="Invalidate snapshots">
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages} className="btn-outline btn-sm"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
