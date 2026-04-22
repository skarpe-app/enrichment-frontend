import { useMemo, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDeleteList, useLists } from '../hooks/useLists';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Trash2,
  Upload,
  UsersRound,
} from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export function ListsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const { data, isLoading } = useLists(page);
  const deleteList = useDeleteList();
  const navigate = useNavigate();

  const visibleLists = useMemo(() => {
    const lists = data?.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((list) =>
      [list.name, list.fileName, list.status].some((value) => value.toLowerCase().includes(q))
    );
  }, [data?.data, query]);

  function handleDelete(e: MouseEvent, listId: string, name: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone for pending/failed lists.`)) return;
    deleteList.mutate(listId);
  }

  return (
    <div className="min-h-full animate-in">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-5">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workspace</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Contacts</h1>
        </div>
        <Link to="/import" className="btn-primary btn-md">
          <Upload className="h-4 w-4" />
          Import CSV
        </Link>
      </div>

      <div className="toolbar">
        <div className="relative min-w-64 flex-1 md:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lists..."
            className="input pl-9"
          />
        </div>
        <span className="chip">
          {data?.pagination.totalItems.toLocaleString() ?? 0} lists
        </span>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.data.length ? (
          <div className="empty-state">
            <UsersRound className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-black text-foreground">No contact lists</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload a CSV to create the first list.</p>
            <Link to="/import" className="btn-primary btn-md mt-5">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </div>
        ) : (
          <>
            <div className="table-shell">
              <div className="table-scroll max-h-[calc(100vh-15rem)]">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lead List</th>
                      <th>Status</th>
                      <th className="text-right">Imported</th>
                      <th className="text-right">Rejected</th>
                      <th className="text-right">Duplicates</th>
                      <th>Created</th>
                      <th className="w-12"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLists.map((list) => (
                      <tr
                        key={list.id}
                        className={list.status === 'ready' ? 'cursor-pointer' : ''}
                        onClick={() => (list.status === 'ready' ? navigate(`/lists/${list.id}`) : undefined)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-foreground">{list.name}</div>
                              <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{list.fileName}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={list.status} />
                        </td>
                        <td className="text-right font-mono">{list.importedCount.toLocaleString()}</td>
                        <td className="text-right font-mono text-muted-foreground">{list.rejectedCount.toLocaleString()}</td>
                        <td className="text-right font-mono text-muted-foreground">{list.duplicateCount.toLocaleString()}</td>
                        <td className="text-sm text-muted-foreground">
                          {new Date(list.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <button
                            onClick={(event) => handleDelete(event, list.id, list.name)}
                            className="icon-btn hover:text-destructive"
                            disabled={deleteList.isPending}
                            title="Delete list"
                            aria-label={`Delete ${list.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {visibleLists.length === 0 && (
              <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                No lists match the current search.
              </div>
            )}

            {data.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {((page - 1) * data.pagination.pageSize) + 1}-{Math.min(page * data.pagination.pageSize, data.pagination.totalItems)} of {data.pagination.totalItems}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm" title="Previous page">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="btn-outline btn-sm" title="Next page">
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
