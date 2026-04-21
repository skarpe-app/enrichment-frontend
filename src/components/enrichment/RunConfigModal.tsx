import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { CreateRunRequest, SettingsResponse } from '@/types/api';
import { X, Loader2, Sparkles, Globe, Settings as SettingsIcon, Zap } from 'lucide-react';

interface RunConfigModalProps {
  listId: string;
  onClose: () => void;
  onSubmit: (config: CreateRunRequest) => void;
  isSubmitting: boolean;
}

export function RunConfigModal({ onClose, onSubmit, isSubmitting }: RunConfigModalProps) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingsResponse>('/api/settings'),
  });

  const { data: modelsData } = useQuery({
    queryKey: ['models', 'openai'],
    queryFn: () => apiFetch<{ models: Array<{ id: string; name: string }> }>('/api/settings/models/openai'),
  });

  const [domainResolutionMode, setDomainResolutionMode] = useState<'email_only' | 'website_only' | 'combined'>('combined');
  const [combinedPriority, setCombinedPriority] = useState<'email_first' | 'website_first'>('email_first');
  const [aiModel, setAiModel] = useState('gpt-4.1-mini');
  const [promptSource, setPromptSource] = useState<'default' | 'stored' | 'text'>('default');
  const [promptId, setPromptId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [billingSource, setBillingSource] = useState<'system_default' | 'user_credential'>('system_default');
  const [forceRescrape, setForceRescrape] = useState(false);
  const [domainCacheTtlDays, setDomainCacheTtlDays] = useState(30);

  useEffect(() => {
    if (settings?.profile.domainCacheTtlDays) setDomainCacheTtlDays(settings.profile.domainCacheTtlDays);
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
      ...(billingSource === 'user_credential' ? {
        aiCredentialId: settings?.aiCredentials.find((c) => c.isDefault)?.id,
      } : {}),
      forceRescrape,
      domainCacheTtlDays,
      scopeType: 'all',
    };

    if (billingSource === 'user_credential' && !config.aiCredentialId) {
      alert('No default AI credential set. Add one in Settings first.');
      return;
    }

    onSubmit(config);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-xl card shadow-2xl shadow-black/30 max-h-[90vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Start Enrichment</h2>
              <p className="text-xs text-muted-foreground">Configure the AI enrichment run</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Domain Source */}
          <Section icon={Globe} title="Domain Source" description="Where to find the company to classify">
            <div className="space-y-2">
              {[
                { value: 'email_only', label: 'Email Domain', desc: 'Use email domain, ignore website' },
                { value: 'website_only', label: 'Website Column', desc: 'Use website URL, skip if empty' },
                { value: 'combined', label: 'Combined', desc: 'Try one first, fallback to other' },
              ].map((opt) => (
                <label key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    domainResolutionMode === opt.value
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:bg-accent/30'
                  }`}>
                  <input type="radio" name="domainMode" value={opt.value} checked={domainResolutionMode === opt.value}
                    onChange={() => setDomainResolutionMode(opt.value as any)} className="mt-0.5 accent-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {domainResolutionMode === 'combined' && (
              <div className="mt-3 flex items-center gap-3 ml-6 animate-in">
                <label className="text-sm text-muted-foreground">Priority:</label>
                <select value={combinedPriority} onChange={(e) => setCombinedPriority(e.target.value as any)} className="input input-sm max-w-48">
                  <option value="email_first">Email first</option>
                  <option value="website_first">Website first</option>
                </select>
              </div>
            )}
          </Section>

          {/* AI Settings */}
          <Section icon={Sparkles} title="AI Model & Prompt" description="How to classify each domain">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Model</label>
                <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="input mt-1">
                  {(modelsData?.models ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">API Key</label>
                <select value={billingSource} onChange={(e) => setBillingSource(e.target.value as any)} className="input mt-1">
                  <option value="system_default">Company default</option>
                  {hasUserCredential && <option value="user_credential">My API key</option>}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Prompt</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(['default', 'stored', 'text'] as const).map((ps) => (
                  <label key={ps}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors text-sm ${
                      promptSource === ps ? 'border-primary/50 bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-accent/30'
                    }`}>
                    <input type="radio" name="promptSource" value={ps} checked={promptSource === ps}
                      onChange={() => setPromptSource(ps)} className="hidden" />
                    {ps === 'default' ? 'Default' : ps === 'stored' ? 'Stored ID' : 'Custom Text'}
                  </label>
                ))}
              </div>
              {promptSource === 'stored' && (
                <input value={promptId} onChange={(e) => setPromptId(e.target.value)} placeholder="pmpt_xxx" className="input mt-2" />
              )}
              {promptSource === 'text' && (
                <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Enter your classification prompt..." rows={4} className="input mt-2 font-mono text-xs" />
              )}
            </div>
          </Section>

          {/* Scrape Settings */}
          <Section icon={SettingsIcon} title="Scrape Settings" description="Cache and re-scrape options">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={forceRescrape} onChange={(e) => setForceRescrape(e.target.checked)} className="accent-primary h-4 w-4" />
              <div>
                <div className="text-sm text-foreground">Force re-scrape</div>
                <div className="text-xs text-muted-foreground">Ignore cache, fetch fresh website content</div>
              </div>
            </label>
            <div className="flex items-center gap-3 mt-3">
              <label className="text-sm text-muted-foreground">Cache TTL:</label>
              <input type="number" value={domainCacheTtlDays} min={1} max={365}
                onChange={(e) => setDomainCacheTtlDays(parseInt(e.target.value) || 30)}
                className="input input-sm max-w-20" />
              <span className="text-xs text-muted-foreground">days (use cached data if newer than this)</span>
            </div>
          </Section>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <button type="submit" disabled={isSubmitting} className="btn-primary btn-md flex-1">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
              ) : (
                <><Zap className="h-4 w-4" /> Start Enrichment</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-outline btn-md">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }: {
  icon: any; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
