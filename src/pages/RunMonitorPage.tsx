import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useResumeRun, useRetryItems, useRunProgress, useStopRun } from '../hooks/useRun';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Loader2,
  Play,
  RotateCcw,
  SkipForward,
  Square,
  TerminalSquare,
  XCircle,
} from 'lucide-react';
import type { RunEventDto } from '@/types/api';

export function RunMonitorPage() {
  const { runId } = useParams<{ runId: string }>();
  const [sinceId, setSinceId] = useState<number | null>(null);
  const [allEvents, setAllEvents] = useState<RunEventDto[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const { data } = useRunProgress(runId, sinceId);
  const stopRun = useStopRun();
  const resumeRun = useResumeRun();
  const retryItems = useRetryItems(runId ?? '');

  useEffect(() => {
    if (data?.events && data.events.length > 0) {
      setAllEvents((previous) => {
        const existingIds = new Set(previous.map((event) => event.id));
        const newEvents = data.events.filter((event) => !existingIds.has(event.id));
        return [...previous, ...newEvents];
      });
      if (data.lastEventId) setSinceId(data.lastEventId);
    }
  }, [data?.events, data?.lastEventId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [allEvents]);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { run } = data;
  const accounted = run.completedItems + run.failedItems + run.skippedItems;
  const progress = run.totalItems > 0 ? (accounted / run.totalItems) * 100 : 0;
  const isActive = run.status === 'queuing' || run.status === 'processing';
  const isStopped = run.status === 'stopped';
  const isTerminal = run.status === 'completed' || run.status === 'failed';

  const counters = [
    { label: 'Completed', value: run.completedItems.toLocaleString(), icon: CheckCircle2, tone: 'text-primary' },
    { label: 'Failed', value: run.failedItems.toLocaleString(), icon: XCircle, tone: 'text-red-400' },
    { label: 'Skipped', value: run.skippedItems.toLocaleString(), icon: SkipForward, tone: 'text-amber-300' },
    { label: 'Cost', value: `$${parseFloat(run.totalCostUsd).toFixed(4)}`, icon: CircleDollarSign, tone: 'text-sky-300' },
  ];

  return (
    <div className="min-h-full animate-in">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-background px-6 py-5">
        <div>
          <Link to="/lists" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Contacts
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Enrichment Run</h1>
            <StatusBadge status={run.status} />
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">run_{runId?.slice(0, 8)}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isActive && (
            <button onClick={() => stopRun.mutate(runId!)} disabled={stopRun.isPending} className="btn-destructive btn-md">
              <Square className="h-4 w-4" />
              Stop
            </button>
          )}
          {isStopped && (
            <button onClick={() => resumeRun.mutate(runId!)} disabled={resumeRun.isPending} className="btn-primary btn-md">
              <Play className="h-4 w-4" />
              Resume
            </button>
          )}
          {(isTerminal || isStopped) && run.failedItems > 0 && (
            <button onClick={() => retryItems.mutate({ filter: { status: 'failed' } })} disabled={retryItems.isPending} className="btn-outline btn-md">
              <RotateCcw className="h-4 w-4" />
              Retry Failed ({run.failedItems})
            </button>
          )}
          {isTerminal && (
            <button onClick={() => window.open(`/api/runs/${runId}/export`, '_blank')} className="btn-outline btn-md">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {run.errorMessage && (
        <div className="px-6 pt-6">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <div className="text-sm font-black text-destructive">Run Error</div>
                <div className="mt-1 text-sm text-destructive/85">{run.errorMessage}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-4">
          <div className="panel p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <div className="kbd-label">Progress</div>
                <div className="mt-2 text-3xl font-black tabular-nums text-foreground">
                  {accounted.toLocaleString()}
                  <span className="ml-2 text-base font-semibold text-muted-foreground">/ {run.totalItems.toLocaleString()} items</span>
                </div>
              </div>
              <div className="text-right">
                <div className="kbd-label">Complete</div>
                <div className="mt-2 text-3xl font-black tabular-nums text-foreground">{progress.toFixed(1)}%</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">Event Log</h2>
              </div>
              {isActive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div ref={logRef} className="panel h-[28rem] overflow-y-auto p-3 font-mono text-xs">
              {allEvents.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  {isActive ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for events<span className="loading-dots" /></span>
                    </div>
                  ) : (
                    'No events.'
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {allEvents.map((event) => (
                    <div key={event.id} className="grid grid-cols-[5rem_7rem_minmax(0,1fr)_4rem] items-center gap-3 rounded px-2 py-1 transition-colors hover:bg-accent">
                      <span className="text-muted-foreground/70">{new Date(event.createdAt).toLocaleTimeString()}</span>
                      <span className={eventColor(event.status)}>[{event.step}]</span>
                      <span className="truncate text-foreground">{event.message}</span>
                      <span className="text-right text-muted-foreground">{event.durationMs != null ? `${event.durationMs}ms` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {counters.map((counter) => (
            <div key={counter.label} className="metric">
              <div className="flex items-center justify-between">
                <span className="kbd-label">{counter.label}</span>
                <counter.icon className={`h-4 w-4 ${counter.tone}`} />
              </div>
              <div className={`mt-4 text-2xl font-black tabular-nums ${counter.tone}`}>{counter.value}</div>
            </div>
          ))}

          <div className="panel p-4">
            <div className="kbd-label">Tokens</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Input</div>
                <div className="mt-1 font-mono text-lg font-black text-foreground">{run.totalInputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Output</div>
                <div className="mt-1 font-mono text-lg font-black text-foreground">{run.totalOutputTokens.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function eventColor(status: string) {
  if (status === 'success') return 'font-black text-primary';
  if (status === 'failed') return 'font-black text-red-400';
  if (status === 'cached') return 'font-black text-sky-300';
  return 'font-black text-amber-300';
}
