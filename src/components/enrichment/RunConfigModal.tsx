import { useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import type { CreateRunRequest, SettingsResponse } from '@/types/api';
import { Database, Globe2, Loader2, Settings2, Sparkles, X, Zap } from 'lucide-react';

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

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const config: CreateRunRequest = {
      domainResolutionMode,
      ...(domainResolutionMode === 'combined' ? { combinedPriority } : {}),
      aiModel,
      promptSource,
      ...(promptSource === 'stored' ? { promptId } : {}),
      ...(promptSource === 'text' ? { promptText } : {}),
      billingSource,
      ...(billingSource === 'user_credential'
        ? { aiCredentialId: settings?.aiCredentials.find((credential) => credential.isDefault)?.id }
        : {}),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl shadow-black/40 animate-in">
        <div className="flex min-h-16 items-center justify-between border-b border-border bg-card px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Start Enrichment</h2>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Configure Run
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Section icon={Globe2} title="Domain Source">
              <div className="space-y-2">
                {[
                  { value: 'email_only', label: 'Email Domain', desc: 'Use email domain only' },
                  { value: 'website_only', label: 'Website Column', desc: 'Use website URL only' },
                  { value: 'combined', label: 'Combined', desc: 'Use fallback resolution' },
                ].map((option) => (
                  <RadioRow
                    key={option.value}
                    checked={domainResolutionMode === option.value}
                    label={option.label}
                    description={option.desc}
                    onChange={() => setDomainResolutionMode(option.value as typeof domainResolutionMode)}
                    name="domainMode"
                    value={option.value}
                  />
                ))}
              </div>
              {domainResolutionMode === 'combined' && (
                <select value={combinedPriority} onChange={(event) => setCombinedPriority(event.target.value as typeof combinedPriority)} className="input input-sm mt-3">
                  <option value="email_first">Email first</option>
                  <option value="website_first">Website first</option>
                </select>
              )}
            </Section>

            <Section icon={Sparkles} title="Model and Prompt">
              <div className="grid gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Model</span>
                  <select value={aiModel} onChange={(event) => setAiModel(event.target.value)} className="input">
                    {(modelsData?.models ?? [{ id: aiModel, name: aiModel }]).map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">API Key</span>
                  <select value={billingSource} onChange={(event) => setBillingSource(event.target.value as typeof billingSource)} className="input">
                    <option value="system_default">Company default</option>
                    {hasUserCredential && <option value="user_credential">My API key</option>}
                  </select>
                </label>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(['default', 'stored', 'text'] as const).map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setPromptSource(source)}
                    className={`h-9 rounded-md border px-2 text-xs font-black capitalize transition-colors ${
                      promptSource === source ? 'border-primary/35 bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
              {promptSource === 'stored' && (
                <input value={promptId} onChange={(event) => setPromptId(event.target.value)} placeholder="pmpt_xxx" className="input mt-3" />
              )}
              {promptSource === 'text' && (
                <textarea value={promptText} onChange={(event) => setPromptText(event.target.value)} placeholder="Enter classification prompt..." rows={4} className="textarea mt-3 font-mono text-xs" />
              )}
            </Section>

            <Section icon={Settings2} title="Scrape Settings">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3">
                <input type="checkbox" checked={forceRescrape} onChange={(event) => setForceRescrape(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                <span>
                  <span className="block text-sm font-semibold text-foreground">Force re-scrape</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Ignore cached website snapshots.</span>
                </span>
              </label>
              <label className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm text-muted-foreground">Cache TTL</span>
                <input
                  type="number"
                  value={domainCacheTtlDays}
                  min={1}
                  max={365}
                  onChange={(event) => setDomainCacheTtlDays(parseInt(event.target.value) || 30)}
                  className="input input-sm max-w-28"
                />
              </label>
            </Section>

            <Section icon={Database} title="Scope">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="text-sm font-semibold text-foreground">All contacts</div>
                <div className="mt-1 text-xs text-muted-foreground">This run will process every contact in the current list.</div>
              </div>
            </Section>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
            <button type="submit" disabled={isSubmitting} className="btn-primary btn-md flex-1">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Start Enrichment
            </button>
            <button type="button" onClick={onClose} className="btn-outline btn-md">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: ComponentType<{ className?: string }>; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function RadioRow({
  checked,
  label,
  description,
  onChange,
  name,
  value,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: () => void;
  name: string;
  value: string;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${checked ? 'border-primary/35 bg-primary/10' : 'border-border bg-background hover:border-primary/25'}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="mt-1 accent-primary" />
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
