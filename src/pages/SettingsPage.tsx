import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { SettingsResponse } from '@/types/api';
import { Check, Database, Key, Loader2, Pencil, Plus, Trash2, User, X } from 'lucide-react';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTtl, setEditTtl] = useState(30);

  const [showAddCred, setShowAddCred] = useState(false);
  const [newCredLabel, setNewCredLabel] = useState('');
  const [newCredKey, setNewCredKey] = useState('');

  const [showCreateField, setShowCreateField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const updateProfile = useMutation({
    mutationFn: (data: { name?: string | null; domainCacheTtlDays?: number }) =>
      apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditingProfile(false);
    },
  });

  const createCred = useMutation({
    mutationFn: (data: { provider: string; label: string; apiKey: string }) =>
      apiFetch('/api/settings/ai-credentials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddCred(false);
      setNewCredLabel('');
      setNewCredKey('');
    },
  });

  const deleteCred = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/settings/ai-credentials/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const setDefaultCred = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/settings/ai-credentials/${id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const createField = useMutation({
    mutationFn: (data: { name: string; fieldType: string }) =>
      apiFetch('/api/custom-fields', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowCreateField(false);
      setNewFieldName('');
      setNewFieldType('text');
    },
  });

  const deleteField = useMutation({
    mutationFn: (fieldId: string) => apiFetch(`/api/custom-fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return <div className="p-6 text-sm text-muted-foreground">Settings not found.</div>;
  }

  return (
    <div className="min-h-full animate-in">
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workspace</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <section className="panel overflow-hidden">
          <SectionHeader
            icon={<User className="h-4 w-4 text-primary" />}
            title="Profile"
            action={!editingProfile && (
              <button
                onClick={() => {
                  setEditName(settings.profile.name ?? '');
                  setEditTtl(settings.profile.domainCacheTtlDays);
                  setEditingProfile(true);
                }}
                className="btn-ghost btn-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          />

          <div className="divide-y divide-border">
            <FieldRow label="Email" value={settings.profile.email} />
            <FieldRow
              label="Name"
              value={settings.profile.name ?? '-'}
              editing={editingProfile}
              editor={<input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Your name" className="input input-sm" />}
            />
            <FieldRow
              label="Role"
              value={<span className={settings.profile.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}>{settings.profile.role}</span>}
            />
            <FieldRow
              label="Cache TTL"
              value={`${settings.profile.domainCacheTtlDays} days`}
              editing={editingProfile}
              editor={
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editTtl}
                    min={1}
                    max={365}
                    onChange={(event) => setEditTtl(parseInt(event.target.value) || 30)}
                    className="input input-sm max-w-24"
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              }
            />
          </div>

          {editingProfile && (
            <div className="flex gap-2 border-t border-border p-4">
              <button
                onClick={() => updateProfile.mutate({ name: editName || null, domainCacheTtlDays: editTtl })}
                disabled={updateProfile.isPending}
                className="btn-primary btn-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
              <button onClick={() => setEditingProfile(false)} className="btn-outline btn-sm">
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="panel overflow-hidden">
            <SectionHeader
              icon={<Key className="h-4 w-4 text-primary" />}
              title="AI Credentials"
              action={
                <button onClick={() => setShowAddCred(true)} className="btn-outline btn-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Key
                </button>
              }
            />

            {showAddCred && (
              <div className="border-b border-border p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={newCredLabel} onChange={(event) => setNewCredLabel(event.target.value)} placeholder="Label" className="input input-sm" />
                  <input value={newCredKey} onChange={(event) => setNewCredKey(event.target.value)} placeholder="sk-..." type="password" className="input input-sm" />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => createCred.mutate({ provider: 'openai', label: newCredLabel, apiKey: newCredKey })}
                    disabled={!newCredLabel.trim() || !newCredKey.trim() || createCred.isPending}
                    className="btn-primary btn-sm"
                  >
                    {createCred.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button onClick={() => setShowAddCred(false)} className="btn-outline btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {settings.aiCredentials.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No API keys added. The system default will be used.</div>
            ) : (
              <div className="divide-y divide-border">
                {settings.aiCredentials.map((cred) => (
                  <div key={cred.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{cred.label}</span>
                        {cred.isDefault && <span className="badge-primary">Default</span>}
                      </div>
                      <div className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{cred.provider}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!cred.isDefault && (
                        <button onClick={() => setDefaultCred.mutate(cred.id)} className="btn-ghost btn-sm">Set Default</button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${cred.label}"?`)) deleteCred.mutate(cred.id);
                        }}
                        className="icon-btn hover:text-destructive"
                        title="Delete credential"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel overflow-hidden">
            <SectionHeader
              icon={<Database className="h-4 w-4 text-primary" />}
              title="Custom Fields"
              action={
                <button onClick={() => setShowCreateField(true)} className="btn-outline btn-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Field
                </button>
              }
            />

            {showCreateField && (
              <div className="border-b border-border p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <input type="text" value={newFieldName} onChange={(event) => setNewFieldName(event.target.value)} placeholder="Field name" className="input input-sm" />
                  <select value={newFieldType} onChange={(event) => setNewFieldType(event.target.value)} className="input input-sm">
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                    <option value="url">URL</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => createField.mutate({ name: newFieldName, fieldType: newFieldType })}
                    disabled={!newFieldName.trim() || createField.isPending}
                    className="btn-primary btn-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Create
                  </button>
                  <button onClick={() => setShowCreateField(false)} className="btn-outline btn-sm">Cancel</button>
                </div>
              </div>
            )}

            {settings.customFields.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No custom fields yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {settings.customFields.map((field) => (
                  <div key={field.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{field.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <code className="rounded border border-border bg-background px-1.5 py-0.5 font-mono">{field.fieldKey}</code>
                        <span>{field.fieldType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${field.name}"? This will permanently remove all data for this field.`)) {
                          deleteField.mutate(field.id);
                        }
                      }}
                      className="icon-btn hover:text-destructive"
                      title="Delete field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-black text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function FieldRow({
  label,
  value,
  editing,
  editor,
}: {
  label: string;
  value: ReactNode;
  editing?: boolean;
  editor?: ReactNode;
}) {
  return (
    <div className="grid min-h-12 grid-cols-[7rem_minmax(0,1fr)] items-center gap-4 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm text-foreground">{editing && editor ? editor : value}</div>
    </div>
  );
}
