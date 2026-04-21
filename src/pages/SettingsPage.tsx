import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { SettingsResponse } from '@/types/api';
import { Plus, Trash2, GripVertical, Pencil, Check } from 'lucide-react';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });

  const [showCreateField, setShowCreateField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTtl, setEditTtl] = useState(30);

  // AI credential state
  const [showAddCred, setShowAddCred] = useState(false);
  const [newCredLabel, setNewCredLabel] = useState('');
  const [newCredKey, setNewCredKey] = useState('');

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
      apiFetch('/api/custom-fields', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowCreateField(false);
      setNewFieldName('');
      setNewFieldType('text');
    },
  });

  const deleteField = useMutation({
    mutationFn: (fieldId: string) =>
      apiFetch(`/api/custom-fields/${fieldId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!settings) return <div className="p-6 text-muted-foreground">Settings not found.</div>;

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          {!editingProfile && (
            <button onClick={() => { setEditName(settings.profile.name ?? ''); setEditTtl(settings.profile.domainCacheTtlDays); setEditingProfile(true); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{settings.profile.email}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Name</span>
            {editingProfile ? (
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name"
                className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground w-48 text-right" />
            ) : (
              <span className="text-foreground">{settings.profile.name ?? '-'}</span>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="text-foreground">{settings.profile.role}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">Cache TTL</span>
            {editingProfile ? (
              <div className="flex items-center gap-1">
                <input type="number" value={editTtl} min={1} max={365} onChange={(e) => setEditTtl(parseInt(e.target.value) || 30)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground w-20 text-right" />
                <span className="text-muted-foreground">days</span>
              </div>
            ) : (
              <span className="text-foreground">{settings.profile.domainCacheTtlDays} days</span>
            )}
          </div>
          {editingProfile && (
            <div className="flex gap-2 pt-2">
              <button onClick={() => updateProfile.mutate({ name: editName || null, domainCacheTtlDays: editTtl })}
                disabled={updateProfile.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button onClick={() => setEditingProfile(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground">Cancel</button>
            </div>
          )}
        </div>
      </section>

      {/* AI Credentials */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">AI Credentials</h2>
          <button
            onClick={() => setShowAddCred(true)}
            className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Plus className="h-3.5 w-3.5" /> Add Key
          </button>
        </div>

        {showAddCred && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newCredLabel}
                onChange={(e) => setNewCredLabel(e.target.value)}
                placeholder="Label (e.g. Personal OpenAI)"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
              <input
                value={newCredKey}
                onChange={(e) => setNewCredKey(e.target.value)}
                placeholder="API Key (sk-...)"
                type="password"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createCred.mutate({ provider: 'openai', label: newCredLabel, apiKey: newCredKey })}
                disabled={!newCredLabel.trim() || !newCredKey.trim() || createCred.isPending}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => setShowAddCred(false)} className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground">Cancel</button>
            </div>
          </div>
        )}

        {settings.aiCredentials.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            No API keys added. The system default key will be used for enrichment.
          </div>
        ) : (
          <div className="space-y-2">
            {settings.aiCredentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{cred.label}</span>
                  <span className="text-xs text-muted-foreground">{cred.provider}</span>
                  {cred.isDefault && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!cred.isDefault && (
                    <button
                      onClick={() => setDefaultCred.mutate(cred.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`Delete "${cred.label}"?`)) deleteCred.mutate(cred.id); }}
                    className="text-muted-foreground hover:text-destructive"
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Custom Fields</h2>
          <button
            onClick={() => setShowCreateField(true)}
            className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Plus className="h-3.5 w-3.5" /> Add Field
          </button>
        </div>

        {showCreateField && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Field name"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
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
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateField(false)}
                className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {settings.customFields.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
            No custom fields yet. Add one above or create during CSV import.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 w-8"><span className="sr-only">Reorder</span></th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Key</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 w-10"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {settings.customFields.map((field) => (
                  <tr key={field.id} className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{field.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground font-mono">{field.fieldKey}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{field.fieldType}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${field.name}"? This will permanently remove all data for this field.`))
                            deleteField.mutate(field.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
