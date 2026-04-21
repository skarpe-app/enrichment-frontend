import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useListDetail, useContacts } from '../hooks/useLists';
import { useCreateRun } from '../hooks/useRun';
import { RunConfigModal } from '../components/enrichment/RunConfigModal';
import { apiFetch } from '../lib/api';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Play, Download, ArrowUpDown } from 'lucide-react';
import type { CreateRunRequest, RunSummary, PaginatedResponse, SettingsResponse } from '@/types/api';

type Tab = 'contacts' | 'runs';

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: list, isLoading: listLoading } = useListDetail(id);
  const [tab, setTab] = useState<Tab>('contacts');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('row_index');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [showRunConfig, setShowRunConfig] = useState(false);
  const { data: contactsData, isLoading: contactsLoading } = useContacts(id, page, 50, search);
  const createRun = useCreateRun(id ?? '');

  // Custom fields for dynamic columns
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });

  // Runs history for the Runs tab
  const { data: runsData } = useQuery({
    queryKey: ['list-runs', id],
    queryFn: () => apiFetch<PaginatedResponse<RunSummary>>(`/api/lists/${id}/runs?pageSize=20`),
    enabled: !!id && tab === 'runs',
  });

  if (listLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!list) return <div className="p-6 text-muted-foreground">List not found.</div>;

  const customFields = settings?.customFields ?? [];

  function handleStartRun(config: CreateRunRequest) {
    createRun.mutate(config, {
      onSuccess: (data) => {
        setShowRunConfig(false);
        navigate(`/runs/${data.run.id}`);
      },
    });
  }

  function handleExportCsv() {
    window.open(`/api/lists/${id}/export`, '_blank');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function toggleSort(column: string) {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setOrder('asc');
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/lists" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{list.name}</h1>
            <p className="text-sm text-muted-foreground">
              {list.importedCount.toLocaleString()} contacts
              {list.rejectedCount > 0 && ` / ${list.rejectedCount} rejected`}
              {list.duplicateCount > 0 && ` / ${list.duplicateCount} duplicates`}
            </p>
          </div>
        </div>
        {list.status === 'ready' && (
          <div className="flex gap-2">
            <button onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={() => setShowRunConfig(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Play className="h-4 w-4" /> Enrich All
            </button>
          </div>
        )}
      </div>

      {showRunConfig && id && (
        <RunConfigModal listId={id} onClose={() => setShowRunConfig(false)}
          onSubmit={handleStartRun} isSubmitting={createRun.isPending} />
      )}

      {/* Tabs per §14 */}
      <div className="flex gap-1 border-b border-border">
        {(['contacts', 'runs'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'contacts' ? 'Contacts' : 'Runs'}
          </button>
        ))}
      </div>

      {/* ─── Contacts Tab ──────────────────────────────────────────────────── */}
      {tab === 'contacts' && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email, name, or company..."
                className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button type="submit" className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">Search</button>
          </form>

          {contactsLoading ? (
            <div className="text-muted-foreground">Loading contacts...</div>
          ) : !contactsData?.data.length ? (
            <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
              {search ? 'No contacts match your search.' : 'No contacts in this list.'}
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-card">
                      <SortHeader label="#" column="row_index" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Email" column="email" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Name" column="name" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Company" column="company_name" sort={sort} order={order} onSort={toggleSort} />
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Industry</th>
                      <SortHeader label="Confidence" column="confidence" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Status" column="status" sort={sort} order={order} onSort={toggleSort} />
                      {customFields.map((cf) => (
                        <th key={cf.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{cf.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contactsData.data.map((contact) => (
                      <tr key={contact.id} className="border-b border-border hover:bg-accent/30">
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{contact.rowIndex}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{contact.email}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{contact.name ?? '-'}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{contact.companyName ?? '-'}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{contact.industry ?? '-'}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{contact.confidence ?? '-'}</td>
                        <td className="px-4 py-2.5">
                          {contact.latestStatus ? (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              contact.latestStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                              contact.latestStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
                              contact.latestStatus === 'skipped' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>{contact.latestStatus}</span>
                          ) : <span className="text-xs text-muted-foreground">-</span>}
                        </td>
                        {customFields.map((cf) => (
                          <td key={cf.id} className="px-4 py-2.5 text-sm text-muted-foreground">
                            {contact.customFields?.[cf.fieldKey] != null ? String(contact.customFields[cf.fieldKey]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {contactsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {contactsData.pagination.totalItems.toLocaleString()} contacts / Page {page} of {contactsData.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= contactsData.pagination.totalPages} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Runs Tab ──────────────────────────────────────────────────────── */}
      {tab === 'runs' && (
        <>
          {!runsData?.data.length ? (
            <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
              No enrichment runs yet. Click "Enrich All" to start.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Model</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Completed</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Failed</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {runsData.data.map((run) => (
                    <tr key={run.id} className="border-b border-border hover:bg-accent/30 cursor-pointer"
                      onClick={() => navigate(`/runs/${run.id}`)}>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          run.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                          run.status === 'stopped' ? 'bg-orange-500/20 text-orange-400' :
                          run.status === 'queuing' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{run.status}</span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">{run.aiModel}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">{run.totalItems}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-green-400">{run.completedItems}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-red-400">{run.failedItems}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">${parseFloat(run.totalCostUsd).toFixed(4)}</td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">{new Date(run.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sort header component ───────────────────────────────────────────────────

function SortHeader({ label, column, sort, order, onSort }: {
  label: string; column: string; sort: string; order: 'asc' | 'desc'; onSort: (col: string) => void;
}) {
  const active = sort === column;
  return (
    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
      onClick={() => onSort(column)}>
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </span>
    </th>
  );
}
