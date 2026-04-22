import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { AdminDomainRow, PaginatedResponse } from '@/types/api';
import { ChevronLeft, ChevronRight, Globe2, Loader2, RefreshCcw, Search, X } from 'lucide-react';

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

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearch('');
    setSearchInput('');
    setPage(1);
  }

  return (
    <div className="min-h-full animate-in">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Admin</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Domain Cache</h1>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="relative min-w-64 flex-1 md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search domains..."
            className="input pl-9 pr-9"
          />
          {searchInput && (
            <button type="button" onClick={clearSearch} className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <span className="chip">{data?.pagination.totalItems.toLocaleString() ?? 0} domains</span>
        {search && <span className="chip">Search: {search}</span>}
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.data.length ? (
          <div className="empty-state">
            <Globe2 className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-black text-foreground">{search ? 'No matching domains' : 'No cached domains'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{search ? 'Clear search or try another term.' : 'Runs will populate the domain cache.'}</p>
          </div>
        ) : (
          <>
            <div className="table-shell">
              <div className="table-scroll max-h-[calc(100vh-16rem)]">
                <table className="data-table min-w-[960px]">
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>DNS</th>
                      <th>Latest Snapshot</th>
                      <th className="text-right">Classifications</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((domain) => (
                      <tr key={domain.domain}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                              <Globe2 className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-sm font-semibold text-foreground">{domain.domain}</span>
                          </div>
                        </td>
                        <td>
                          {domain.dnsValid === null ? (
                            <span className="badge-neutral">Unknown</span>
                          ) : domain.dnsValid ? (
                            <span className="badge-success">Valid</span>
                          ) : (
                            <span className="badge-danger">Failed</span>
                          )}
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {domain.latestSnapshotAt
                            ? new Date(domain.latestSnapshotAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="text-right font-mono">{domain.classificationsCount.toLocaleString()}</td>
                        <td>
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                if (confirm(`Invalidate all snapshots for ${domain.domain}?`)) invalidate.mutate(domain.domain);
                              }}
                              className="icon-btn"
                              title="Invalidate snapshots"
                              aria-label={`Invalidate ${domain.domain}`}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Page {page} of {data.pagination.totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="btn-outline btn-sm" title="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage((value) => Math.min(data.pagination.totalPages, value + 1))} disabled={page >= data.pagination.totalPages} className="btn-outline btn-sm" title="Next page">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
