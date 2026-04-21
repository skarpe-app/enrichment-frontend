import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLists, useDeleteList } from '../hooks/useLists';
import { Upload, Trash2, ChevronLeft, ChevronRight, Loader2, FileText, List as ListIcon } from 'lucide-react';
import { StatusBadge } from '../components/ui/StatusBadge';

export function ListsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLists(page);
  const deleteList = useDeleteList();
  const navigate = useNavigate();

  function handleDelete(e: React.MouseEvent, listId: string, name: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone for pending/failed lists.`)) return;
    deleteList.mutate(listId);
  }

  return (
    <div className="p-8 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Lists</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your imported contact lists</p>
        </div>
        <Link to="/import" className="btn-primary btn-md">
          <Upload className="h-4 w-4" />
          Import CSV
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.data.length ? (
        <div className="card p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
            <ListIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground">No lists yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first CSV to start enriching contacts</p>
          <Link to="/import" className="btn-primary btn-md mt-5 inline-flex">
            <Upload className="h-4 w-4" /> Import your first list
          </Link>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacts</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 w-10" aria-label="Actions"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((list) => (
                  <tr
                    key={list.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => list.status === 'ready' ? navigate(`/lists/${list.id}`) : null}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-border/50">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{list.name}</div>
                          <div className="text-xs text-muted-foreground">{list.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={list.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="text-sm font-medium text-foreground">
                        {list.importedCount.toLocaleString()}
                      </div>
                      {(list.rejectedCount > 0 || list.duplicateCount > 0) && (
                        <div className="text-xs text-muted-foreground">
                          {list.rejectedCount > 0 && `${list.rejectedCount} rejected`}
                          {list.rejectedCount > 0 && list.duplicateCount > 0 && ' · '}
                          {list.duplicateCount > 0 && `${list.duplicateCount} dupes`}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {new Date(list.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => handleDelete(e, list.id, list.name)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        disabled={deleteList.isPending}
                        title="Delete list"
                      >
                        <Trash2 className="h-4 w-4" />
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
                Showing {((page - 1) * data.pagination.pageSize) + 1}–{Math.min(page * data.pagination.pageSize, data.pagination.totalItems)} of {data.pagination.totalItems}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline btn-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="btn-outline btn-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
