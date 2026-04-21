import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { SettingsResponse } from '@/types/api';
import { Plus, Trash2, Pencil, Check, X, Loader2, Key, User, Database } from 'lucide-react';

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); setEditingProfile(false); },
  });

  const createCred = useMutation({
    mutationFn: (data: { provider: string; label: string; apiKey: string }) =>
      apiFetch('/api/settings/ai-credentials', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddCred(false); setNewCredLabel(''); setNewCredKey('');
    },
  });

  const deleteCred = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/settings/ai-credentials/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const setDefaultCred = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/settings/ai-credentials/${id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const createField = useMutation({
    mutationFn: (data: { name: string; fieldType: string }) =>
      apiFetch('/api/custom-fields', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowCreateField(false); setNewFieldName(''); setNewFieldType('text');
    },
  });

  const deleteField = useMutation({
    mutationFn: (fieldId: string) => apiFetch(`/api/custom-fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  if (isLoading) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!settings) return <div className="p-8 text-muted-foreground">Settings not found.</div>;

  return (
    <div className="p-8 space-y-8 animate-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, API keys, and custom fields</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </div>
          {!editingProfile && (
            <button
              onClick={() => { setEditName(settings.profile.name ?? ''); setEditTtl(settings.profile.domainCacheTtlDays); setEditingProfile(true); }}
              className="btn-ghost btn-sm"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        <div className="card divide-y divide-border">
          <FieldRow label="Email" value={settings.profile.email} />
          <FieldRow
            label="Name"
            value={settings.profile.name ?? '—'}
            editing={editingProfile}
            editor={
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="input input-sm max-w-xs" />
            }
          />
          <FieldRow
            label="Role"
            value={
              <span className={settings.profile.role === 'ADMIN' ? 'badge-primary' : 'badge-neutral'}>
                {settings.profile.role}
              </span>
            }
          />
          <FieldRow
            label="Cache TTL"
            value={`${settings.profile.domainCacheTtlDays} days`}
            editing={editingProfile}
            editor={
              <div className="flex items-center gap-2">
                <input type="number" value={editTtl} min={1} max={365} onChange={(e) => setEditTtl(parseInt(e.target.value) || 30)} className="input input-sm max-w-20" />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            }
          />
          {editingProfile && (
            <div className="flex gap-2 p-4">
              <button
                onClick={() => updateProfile.mutate({ name: editName || null, domainCacheTtlDays: editTtl })}
                disabled={updateProfile.isPending}
                className="btn-primary btn-sm"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button onClick={() => setEditingProfile(false)} className="btn-outline btn-sm">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI Credentials */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">AI Credentials</h2>
          </div>
          <button onClick={() => setShowAddCred(true)} className="btn-outline btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add Key
          </button>
        </div>

        {showAddCred && (
          <div className="card p-4 space-y-3 animate-in">
            <div className="grid grid-cols-2 gap-3">
              <input value={newCredLabel} onChange={(e) => setNewCredLabel(e.target.value)} placeholder="Label (e.g. Personal OpenAI)" className="input input-sm" />
              <input value={newCredKey} onChange={(e) => setNewCredKey(e.target.value)} placeholder="sk-..." type="password" className="input input-sm" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createCred.mutate({ provider: 'openai', label: newCredLabel, apiKey: newCredKey })}
                disabled={!newCredLabel.trim() || !newCredKey.trim() || createCred.isPending}
                className="btn-primary btn-sm"
              >
                {createCred.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
              </button>
              <button onClick={() => setShowAddCred(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {settings.aiCredentials.length === 0 ? (
          <div className="card p-8 text-center">
            <Key className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No API keys added. The system default will be used.</p>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {settings.aiCredentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{cred.label}</span>
                      {cred.isDefault && <span className="badge-primary">Default</span>}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{cred.provider}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!cred.isDefault && (
                    <button onClick={() => setDefaultCred.mutate(cred.id)} className="btn-ghost btn-sm">Set default</button>
                  )}
                  <button
                    onClick={() => { if (confirm(`Delete "${cred.label}"?`)) deleteCred.mutate(cred.id); }}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Fields */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Custom Fields</h2>
          </div>
          <button onClick={() => setShowCreateField(true)} className="btn-outline btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add Field
          </button>
        </div>

        {showCreateField && (
          <div className="card p-4 space-y-3 animate-in">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Field name (e.g. Lead Score)" className="input input-sm" />
              <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="input input-sm">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
                <option value="url">URL</option>
                <option value="select">Select</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createField.mutate({ name: newFieldName, fieldType: newFieldType })}
                disabled={!newFieldName.trim() || createField.isPending}
                className="btn-primary btn-sm"
              >
                <Check className="h-3.5 w-3.5" /> Create
              </button>
              <button onClick={() => setShowCreateField(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {settings.customFields.length === 0 ? (
          <div className="card p-8 text-center">
            <Database className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No custom fields yet. Add one above or create during CSV import.</p>
          </div>
        ) : (
          <div className="card divide-y divide-border">
            {settings.customFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{field.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="rounded bg-accent px-1.5 py-0.5 font-mono">{field.fieldKey}</code>
                      <span>·</span>
                      <span>{field.fieldType}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${field.name}"? This will permanently remove all data for this field.`))
                      deleteField.mutate(field.id);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── FieldRow helper ────────────────────────────────────────────────────────

function FieldRow({ label, value, editing, editor }: {
  label: string;
  value: React.ReactNode;
  editing?: boolean;
  editor?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm text-foreground">
        {editing && editor ? editor : value}
      </div>
    </div>
  );
}
