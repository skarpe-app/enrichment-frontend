import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useContacts, useListDetail } from '../hooks/useLists';
import { useCreateRun } from '../hooks/useRun';
import { RunConfigModal } from '../components/enrichment/RunConfigModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { apiFetch } from '../lib/api';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Loader2,
  Mail,
  Play,
  Search,
  Users,
  X,
} from 'lucide-react';
import type {
  ContactRow,
  CreateRunRequest,
  CustomFieldDto,
  PaginatedResponse,
  RunSummary,
  SettingsResponse,
} from '@/types/api';

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

  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: contactsData, isLoading: contactsLoading } = useContacts(id, page, 100, search, statusFilter || undefined);
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

  const customFields = settings?.customFields ?? [];

  const sortedContacts = useMemo(() => {
    const contacts = contactsData?.data ?? [];
    return [...contacts].sort((a, b) => {
      const av = getSortValue(a, sort, customFields);
      const bv = getSortValue(b, sort, customFields);
      const direction = order === 'asc' ? 1 : -1;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * direction;
    });
  }, [contactsData?.data, customFields, order, sort]);

  if (listLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!list) {
    return <div className="p-6 text-sm text-muted-foreground">List not found.</div>;
  }

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

  function toggleSort(column: string) {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(column);
      setOrder('asc');
    }
  }

  const latestRun = runsData?.data[0];

  return (
    <div className="flex min-h-full flex-col animate-in">
      <div className="border-b border-border bg-background px-6 py-5">
        <Link to="/lists" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Lists
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-black tracking-tight text-foreground">{list.name}</h1>
              <StatusBadge status={list.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {list.importedCount.toLocaleString()} contacts
              </span>
              <span>Rejected {list.rejectedCount.toLocaleString()}</span>
              <span>Duplicates {list.duplicateCount.toLocaleString()}</span>
              <span className="font-mono">list_{list.id.slice(0, 8)}</span>
            </div>
          </div>

          {list.status === 'ready' && (
            <div className="flex items-center gap-2">
              <button onClick={handleExportCsv} className="btn-outline btn-md">
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button onClick={() => setShowRunConfig(true)} className="btn-primary btn-md">
                <Play className="h-4 w-4" />
                Enrich All
              </button>
            </div>
          )}
        </div>
      </div>

      {showRunConfig && id && (
        <RunConfigModal
          listId={id}
          onClose={() => setShowRunConfig(false)}
          onSubmit={handleStartRun}
          isSubmitting={createRun.isPending}
        />
      )}

      <div className="toolbar">
        <div className="flex rounded-md border border-border bg-background p-0.5">
          <button
            onClick={() => {
              setTab('contacts');
              setPage(1);
            }}
            className={`h-8 rounded px-3 text-sm font-bold transition-colors ${tab === 'contacts' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Contacts
          </button>
          <button
            onClick={() => {
              setTab('runs');
              setPage(1);
            }}
            className={`h-8 rounded px-3 text-sm font-bold transition-colors ${tab === 'runs' ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Runs
          </button>
        </div>

        {tab === 'contacts' && (
          <form onSubmit={handleSearch} className="relative min-w-64 flex-1 md:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search contacts..."
              className="input pl-9 pr-9"
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        )}

        {tab === 'contacts' && (
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            className="input input-sm max-w-48"
          >
            <option value="">All statuses</option>
            <option value="not_run">Not enriched yet</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        )}

        <span className="chip">{contactsData?.pagination.totalItems.toLocaleString() ?? list.importedCount.toLocaleString()} records</span>
        {tab === 'contacts' && list.enrichedCount != null && (
          <span className="chip">
            <span className="text-emerald-400">{list.enrichedCount.toLocaleString()}</span>
            <span className="text-muted-foreground/60">/{list.importedCount.toLocaleString()} enriched</span>
          </span>
        )}
        {search && <span className="chip">Search: {search}</span>}
        {statusFilter && <span className="chip">Status: {statusFilter.replace('_', ' ')}</span>}
        {latestRun && <StatusBadge status={latestRun.status} />}
      </div>

      {tab === 'contacts' ? (
        <div className="min-h-0 flex-1 p-6">
          {contactsLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !contactsData?.data.length ? (
            <div className="empty-state">
              <Mail className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-sm font-black text-foreground">{search ? 'No matching contacts' : 'No contacts in this list'}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{search ? 'Clear search or try another term.' : 'The import has no available contact rows.'}</p>
            </div>
          ) : (
            <>
              <div className="table-shell">
                <div className="table-scroll max-h-[calc(100vh-19.5rem)]">
                  <table className="data-table min-w-[1500px]">
                    <thead>
                      <tr>
                        <SortHeader label="Contact_ID" column="row_index" sort={sort} order={order} onSort={toggleSort} />
                        <th>Lead_List</th>
                        <SortHeader label="Email" column="email" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="First_Name" column="first_name" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Last_Name" column="last_name" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Website" column="website" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Industry" column="industry" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Confidence" column="confidence" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Cost" column="cost" sort={sort} order={order} onSort={toggleSort} />
                        <SortHeader label="Status" column="status" sort={sort} order={order} onSort={toggleSort} />
                        {customFields.map((field) => (
                          <SortHeader
                            key={field.id}
                            label={field.name}
                            column={`custom:${field.fieldKey}`}
                            sort={sort}
                            order={order}
                            onSort={toggleSort}
                          />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedContacts.map((contact) => {
                        const website = contact.companyWebsite || contact.websiteDomain || contact.emailDomain;
                        const confidence = confidencePercent(contact.confidence);
                        return (
                          <tr key={contact.id}>
                            <td className="font-mono text-xs text-muted-foreground">#{contact.rowIndex}</td>
                            <td>
                              <div className="max-w-48 truncate font-semibold">{list.name}</div>
                              <div className="mt-1 font-mono text-xs text-muted-foreground">list_{list.id.slice(0, 8)}</div>
                            </td>
                            <td className="max-w-64 truncate font-semibold">{contact.email}</td>
                            <td className="max-w-40 truncate text-muted-foreground">{contact.firstName ?? firstNameFromContact(contact)}</td>
                            <td className="max-w-40 truncate text-muted-foreground">{contact.lastName ?? lastNameFromContact(contact)}</td>
                            <td className="max-w-64 truncate font-mono text-sm text-primary">{website || '-'}</td>
                            <td>
                              {contact.industry ? (
                                <div className="max-w-72">
                                  <div className="truncate text-sm font-semibold text-foreground">{contact.industry}</div>
                                  {contact.subIndustry && <div className="mt-1 truncate text-xs text-muted-foreground">{contact.subIndustry}</div>}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td>
                              {contact.confidence != null ? (
                                <div className="flex items-center gap-3">
                                  <div className="h-1 w-16 rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${confidence}%` }} />
                                  </div>
                                  <span className="font-mono text-xs text-muted-foreground">{contact.confidence}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="font-mono text-sm text-muted-foreground">{formatMoney(contact.costUsd)}</td>
                            <td>
                              {contact.latestStatus ? <StatusBadge status={contact.latestStatus} /> : <span className="text-xs text-muted-foreground">-</span>}
                            </td>
                            {customFields.map((field) => (
                              <td key={field.id} className="max-w-48 truncate text-sm text-muted-foreground">
                                {formatCustomValue(contact.customFields?.[field.fieldKey])}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {contactsData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {contactsData.pagination.totalPages} · {contactsData.pagination.totalItems.toLocaleString()} contacts
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm" title="Previous page">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(contactsData.pagination.totalPages, p + 1))} disabled={page >= contactsData.pagination.totalPages} className="btn-outline btn-sm" title="Next page">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 p-6">
          {!runsData?.data.length ? (
            <div className="empty-state">
              <Database className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-sm font-black text-foreground">No runs for this list</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start enrichment to create pipeline history.</p>
            </div>
          ) : (
            <div className="table-shell">
              <div className="table-scroll max-h-[calc(100vh-17rem)]">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Run_ID</th>
                      <th>Status</th>
                      <th>Model</th>
                      <th className="text-right">Progress</th>
                      <th className="text-right">Cost</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runsData.data.map((run) => {
                      const accounted = run.completedItems + run.failedItems + run.skippedItems;
                      const progress = run.totalItems > 0 ? (accounted / run.totalItems) * 100 : 0;
                      return (
                        <tr key={run.id} className="cursor-pointer" onClick={() => navigate(`/runs/${run.id}`)}>
                          <td className="font-mono text-xs text-muted-foreground">run_{run.id.slice(0, 8)}</td>
                          <td><StatusBadge status={run.status} /></td>
                          <td className="font-mono text-sm text-muted-foreground">{run.aiModel}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-1 w-20 rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} />
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">{accounted}/{run.totalItems}</span>
                            </div>
                          </td>
                          <td className="text-right font-mono">${parseFloat(run.totalCostUsd).toFixed(4)}</td>
                          <td className="text-sm text-muted-foreground">{formatDateTime(run.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  column,
  sort,
  order,
  onSort,
}: {
  label: string;
  column: string;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (column: string) => void;
}) {
  const active = sort === column;
  return (
    <th className="cursor-pointer select-none hover:text-foreground" onClick={() => onSort(column)}>
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'text-primary' : 'text-muted-foreground/45'}`} />
        {active && <span className="font-mono text-[10px] text-primary">{order}</span>}
      </span>
    </th>
  );
}

function getSortValue(contact: ContactRow, column: string, customFields: CustomFieldDto[]) {
  if (column.startsWith('custom:')) {
    const key = column.slice('custom:'.length);
    const field = customFields.find((item) => item.fieldKey === key);
    const value = contact.customFields?.[key];
    if (field?.fieldType === 'number' && typeof value === 'string') return Number(value);
    return value;
  }

  switch (column) {
    case 'row_index':
      return contact.rowIndex;
    case 'email':
      return contact.email;
    case 'first_name':
      return contact.firstName ?? firstNameFromContact(contact);
    case 'last_name':
      return contact.lastName ?? lastNameFromContact(contact);
    case 'website':
      return contact.companyWebsite || contact.websiteDomain || contact.emailDomain;
    case 'industry':
      return contact.industry;
    case 'confidence':
      return contact.confidence;
    case 'cost':
      return contact.costUsd ? Number(contact.costUsd) : null;
    case 'status':
      return contact.latestStatus;
    default:
      return null;
  }
}

function firstNameFromContact(contact: ContactRow) {
  return contact.name?.split(' ')[0] || '-';
}

function lastNameFromContact(contact: ContactRow) {
  const parts = contact.name?.split(' ').filter(Boolean) ?? [];
  return parts.length > 1 ? parts.slice(1).join(' ') : '-';
}

function confidencePercent(confidence: number | null) {
  if (confidence == null) return 0;
  if (confidence <= 10) return Math.max(0, Math.min(100, confidence * 10));
  return Math.max(0, Math.min(100, confidence));
}

function formatMoney(value: string | null) {
  if (!value) return '$0.0000';
  return `$${parseFloat(value).toFixed(4)}`;
}

function formatCustomValue(value: string | number | boolean | null | undefined) {
  if (value == null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return String(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
