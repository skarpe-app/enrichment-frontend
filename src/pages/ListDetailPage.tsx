import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useListDetail, useContacts } from '../hooks/useLists';
import { useCreateRun } from '../hooks/useRun';
import { RunConfigModal } from '../components/enrichment/RunConfigModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { apiFetch } from '../lib/api';
import {
  ArrowLeft, Search, ChevronLeft, ChevronRight, Play, Download,
  ArrowUpDown, Loader2, Users, Mail,
} from 'lucide-react';
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

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });
  const { data: runsData } = useQuery({
    queryKey: ['list-runs', id],
    queryFn: () => apiFetch<PaginatedResponse<RunSummary>>(`/api/lists/${id}/runs?pageSize=20`),
    enabled: !!id && tab === 'runs',
  });

  if (listLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!list) return <div className="p-8 text-muted-foreground">List not found.</div>;

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
    if (sort === column) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(column); setOrder('asc'); }
  }

  return (
    <div className="p-8 space-y-6 animate-in">
      {/* Header */}
      <div>
        <Link to="/lists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to lists
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{list.name}</h1>
              <StatusBadge status={list.status} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> {list.importedCount.toLocaleString()} contacts
              </span>
              {list.rejectedCount > 0 && <span>· {list.rejectedCount} rejected</span>}
              {list.duplicateCount > 0 && <span>· {list.duplicateCount} duplicates</span>}
            </div>
          </div>
          {list.status === 'ready' && (
            <div className="flex gap-2">
              <button onClick={handleExportCsv} className="btn-outline btn-md">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={() => setShowRunConfig(true)} className="btn-primary btn-md">
                <Play className="h-4 w-4" /> Enrich All
              </button>
            </div>
          )}
        </div>
      </div>

      {showRunConfig && id && (
        <RunConfigModal listId={id} onClose={() => setShowRunConfig(false)}
          onSubmit={handleStartRun} isSubmitting={createRun.isPending} />
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {(['contacts', 'runs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'contacts' ? 'Contacts' : 'Runs'}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Tab */}
      {tab === 'contacts' && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email, name, or company..."
                className="input pl-9"
              />
            </div>
            <button type="submit" className="btn-secondary btn-md">Search</button>
          </form>

          {contactsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !contactsData?.data.length ? (
            <div className="card p-12 text-center">
              <Mail className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                {search ? 'No contacts match your search.' : 'No contacts in this list.'}
              </p>
            </div>
          ) : (
            <>
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <SortHeader label="#" column="row_index" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Email" column="email" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Name" column="name" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Company" column="company_name" sort={sort} order={order} onSort={toggleSort} />
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Industry</th>
                      <SortHeader label="Conf." column="confidence" sort={sort} order={order} onSort={toggleSort} />
                      <SortHeader label="Status" column="status" sort={sort} order={order} onSort={toggleSort} />
                      {customFields.map((cf) => (
                        <th key={cf.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{cf.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contactsData.data.map((contact) => (
                      <tr key={contact.id} className="table-row-hover">
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contact.rowIndex}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{contact.email}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contact.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contact.companyName ?? '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          {contact.industry ? (
                            <span className="badge-primary">{contact.industry}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{contact.confidence ?? '—'}</td>
                        <td className="px-4 py-3">
                          {contact.latestStatus ? <StatusBadge status={contact.latestStatus} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        {customFields.map((cf) => (
                          <td key={cf.id} className="px-4 py-3 text-sm text-muted-foreground">
                            {contact.customFields?.[cf.fieldKey] != null ? String(contact.customFields[cf.fieldKey]) : '—'}
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
                    {contactsData.pagination.totalItems.toLocaleString()} contacts · Page {page} of {contactsData.pagination.totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= contactsData.pagination.totalPages} className="btn-outline btn-sm"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Runs Tab */}
      {tab === 'runs' && (
        <>
          {!runsData?.data.length ? (
            <div className="card p-12 text-center">
              <Play className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No enrichment runs yet. Click "Enrich All" to start.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {runsData.data.map((run) => (
                    <tr key={run.id} className="table-row-hover cursor-pointer" onClick={() => navigate(`/runs/${run.id}`)}>
                      <td className="px-5 py-3.5"><StatusBadge status={run.status} /></td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground font-mono">{run.aiModel}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="text-sm text-foreground">{run.completedItems}/{run.totalItems}</div>
                        <div className="text-xs text-muted-foreground">
                          {run.failedItems > 0 && <span className="text-red-400">{run.failedItems} failed</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-foreground">${parseFloat(run.totalCostUsd).toFixed(4)}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{new Date(run.createdAt).toLocaleDateString()}</td>
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

function SortHeader({ label, column, sort, order, onSort }: {
  label: string; column: string; sort: string; order: 'asc' | 'desc'; onSort: (col: string) => void;
}) {
  const active = sort === column;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(column)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'text-foreground' : 'text-muted-foreground/40'}`} />
      </span>
    </th>
  );
}
