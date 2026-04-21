import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { CreateRunRequest, SettingsResponse } from '@/types/api';
import { X } from 'lucide-react';

interface RunConfigModalProps {
  listId: string;
  onClose: () => void;
  onSubmit: (config: CreateRunRequest) => void;
  isSubmitting: boolean;
}

export function RunConfigModal({ listId, onClose, onSubmit, isSubmitting }: RunConfigModalProps) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });

  const { data: modelsData } = useQuery({
    queryKey: ['models', 'openai'],
    queryFn: () => apiFetch<{ models: Array<{ id: string; name: string }> }>('/api/settings/models/openai'),
  });

  // Form state
  const [domainResolutionMode, setDomainResolutionMode] = useState<'email_only' | 'website_only' | 'combined'>('combined');
  const [combinedPriority, setCombinedPriority] = useState<'email_first' | 'website_first'>('email_first');
  const [aiModel, setAiModel] = useState('gpt-4.1-mini');
  const [promptSource, setPromptSource] = useState<'default' | 'stored' | 'text'>('default');
  const [promptId, setPromptId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [billingSource, setBillingSource] = useState<'system_default' | 'user_credential'>('system_default');
  const [forceRescrape, setForceRescrape] = useState(false);
  const [domainCacheTtlDays, setDomainCacheTtlDays] = useState(30);

  // Pre-fill TTL from profile
  useEffect(() => {
    if (settings?.profile.domainCacheTtlDays) {
      setDomainCacheTtlDays(settings.profile.domainCacheTtlDays);
    }
  }, [settings]);

  const hasUserCredential = (settings?.aiCredentials.length ?? 0) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const config: CreateRunRequest = {
      domainResolutionMode,
      ...(domainResolutionMode === 'combined' ? { combinedPriority } : {}),
      aiModel,
      promptSource,
      ...(promptSource === 'stored' ? { promptId } : {}),
      ...(promptSource === 'text' ? { promptText } : {}),
      billingSource,
      // Auto-select default credential per §13 when user_credential
      ...(billingSource === 'user_credential' ? {
        aiCredentialId: settings?.aiCredentials.find((c) => c.isDefault)?.id,
      } : {}),
      forceRescrape,
      domainCacheTtlDays,
      scopeType: 'all', // Default: enrich all contacts
    };

    if (billingSource === 'user_credential' && !config.aiCredentialId) {
      alert('No default AI credential set. Add one in Settings first.');
      return;
    }

    onSubmit(config);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Start Enrichment Run</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Domain Source */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Domain Source</legend>
            <div className="space-y-1.5">
              {[
                { value: 'email_only', label: 'Email Domain', desc: 'Use email domain, ignore website' },
                { value: 'website_only', label: 'Website Column', desc: 'Use website URL, skip if empty' },
                { value: 'combined', label: 'Combined', desc: 'Try one first, fallback to other' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="domainMode" value={opt.value} checked={domainResolutionMode === opt.value}
                    onChange={() => setDomainResolutionMode(opt.value as any)}
                    className="mt-1" />
                  <div>
                    <span className="text-sm text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {domainResolutionMode === 'combined' && (
              <select value={combinedPriority} onChange={(e) => setCombinedPriority(e.target.value as any)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground ml-6">
                <option value="email_first">Email First</option>
                <option value="website_first">Website First</option>
              </select>
            )}
          </fieldset>

          {/* AI Settings */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wide">AI Settings</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Model</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground">
                  {(modelsData?.models ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">API Key</label>
                <select value={billingSource} onChange={(e) => setBillingSource(e.target.value as any)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground">
                  <option value="system_default">Company Default</option>
                  {hasUserCredential && <option value="user_credential">My API Key</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Prompt</label>
              <div className="flex gap-3 mt-1">
                {(['default', 'stored', 'text'] as const).map((ps) => (
                  <label key={ps} className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
                    <input type="radio" name="promptSource" value={ps} checked={promptSource === ps}
                      onChange={() => setPromptSource(ps)} />
                    {ps === 'default' ? 'Default' : ps === 'stored' ? 'Stored ID' : 'Custom Text'}
                  </label>
                ))}
              </div>
              {promptSource === 'stored' && (
                <input value={promptId} onChange={(e) => setPromptId(e.target.value)}
                  placeholder="Prompt ID (pmpt_...)" className="mt-2 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground" />
              )}
              {promptSource === 'text' && (
                <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter your classification prompt..." rows={3}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground" />
              )}
            </div>
          </fieldset>

          {/* Scrape Settings */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Scrape Settings</legend>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={forceRescrape} onChange={(e) => setForceRescrape(e.target.checked)} />
                Force re-scrape (ignore cache)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground">Cache TTL:</label>
              <input type="number" value={domainCacheTtlDays} min={1} max={365}
                onChange={(e) => setDomainCacheTtlDays(parseInt(e.target.value) || 30)}
                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground" />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? 'Starting...' : 'Start Enrichment'}
            </button>
            <button type="button" onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
