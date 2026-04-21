import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLists, useDeleteList } from '../hooks/useLists';
import { Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400' },
  importing: { label: 'Importing', className: 'bg-blue-500/20 text-blue-400' },
  import_failed: { label: 'Failed', className: 'bg-red-500/20 text-red-400' },
  ready: { label: 'Ready', className: 'bg-green-500/20 text-green-400' },
};

export function ListsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLists(page);
  const deleteList = useDeleteList();
  const navigate = useNavigate();

  function handleDelete(listId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone for pending/failed lists.`)) return;
    deleteList.mutate(listId);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Contact Lists</h1>
        <Link
          to="/import"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">No lists yet. Import a CSV to get started.</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">File</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Contacts</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((list) => {
                  const badge = STATUS_BADGES[list.status] ?? STATUS_BADGES.pending;
                  return (
                    <tr
                      key={list.id}
                      className="border-b border-border hover:bg-accent/30 cursor-pointer"
                      onClick={() => list.status === 'ready' ? navigate(`/lists/${list.id}`) : null}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{list.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{list.fileName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {list.importedCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(list.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(list.id, list.name); }}
                          className="text-muted-foreground hover:text-destructive"
                          disabled={deleteList.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
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
