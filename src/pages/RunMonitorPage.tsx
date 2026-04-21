import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRunProgress, useStopRun, useResumeRun, useRetryItems } from '../hooks/useRun';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  ArrowLeft, Square, Play, RotateCcw, Download, Loader2,
  CheckCircle2, XCircle, SkipForward, DollarSign,
} from 'lucide-react';

export function RunMonitorPage() {
  const { runId } = useParams<{ runId: string }>();
  const [sinceId, setSinceId] = useState<number | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const { data } = useRunProgress(runId, sinceId);
  const stopRun = useStopRun();
  const resumeRun = useResumeRun();
  const retryItems = useRetryItems(runId ?? '');

  useEffect(() => {
    if (data?.events && data.events.length > 0) {
      setAllEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEvents = data.events.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newEvents];
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
  const progress = run.totalItems > 0 ? (accounted / run.totalItems * 100) : 0;
  const isActive = run.status === 'queuing' || run.status === 'processing';
  const isStopped = run.status === 'stopped';
  const isTerminal = run.status === 'completed' || run.status === 'failed';

  const counters = [
    { label: 'Completed', value: run.completedItems, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Failed', value: run.failedItems, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Skipped', value: run.skippedItems, icon: SkipForward, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Cost', value: `$${parseFloat(run.totalCostUsd).toFixed(4)}`, icon: DollarSign, color: 'text-foreground', bg: 'bg-accent', border: 'border-border' },
  ];

  return (
    <div className="p-8 space-y-6 animate-in">
      {/* Header */}
      <div>
        <Link to="/lists" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Enrichment Run</h1>
              <StatusBadge status={run.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground font-mono">#{runId?.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            {isActive && (
              <button onClick={() => stopRun.mutate(runId!)} disabled={stopRun.isPending} className="btn-destructive btn-md">
                <Square className="h-4 w-4" /> Stop
              </button>
            )}
            {isStopped && (
              <button onClick={() => resumeRun.mutate(runId!)} disabled={resumeRun.isPending} className="btn-primary btn-md">
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            {(isTerminal || isStopped) && run.failedItems > 0 && (
              <button onClick={() => retryItems.mutate({ filter: { status: 'failed' } })} disabled={retryItems.isPending} className="btn-outline btn-md">
                <RotateCcw className="h-4 w-4" /> Retry Failed ({run.failedItems})
              </button>
            )}
            {isTerminal && (
              <button onClick={() => window.open(`/api/runs/${runId}/export`, '_blank')} className="btn-outline btn-md">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {run.errorMessage && (
        <div className="card border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-destructive">Run Error</div>
              <div className="text-sm text-destructive/80 mt-0.5">{run.errorMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground tabular-nums">{accounted.toLocaleString()}</span>
              <span className="text-muted-foreground">/ {run.totalItems.toLocaleString()} items</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Complete</div>
            <div className="mt-1 text-3xl font-bold text-foreground tabular-nums">{progress.toFixed(1)}%</div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-accent overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      {/* Counter cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {counters.map((c) => (
          <div key={c.label} className={`card p-5 border ${c.border} ${c.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className={`mt-3 text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Event log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Event Log</h2>
          <span className="text-xs text-muted-foreground">
            {isActive && <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>}
          </span>
        </div>
        <div
          ref={logRef}
          className="card h-96 overflow-y-auto p-4 font-mono text-xs space-y-1"
        >
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
            allEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-0.5 hover:bg-accent/30 rounded px-2 -mx-2">
                <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 font-semibold ${
                  event.status === 'success' ? 'text-emerald-400' :
                  event.status === 'failed' ? 'text-red-400' :
                  event.status === 'cached' ? 'text-blue-400' :
                  'text-amber-400'
                }`}>
                  [{event.step}]
                </span>
                <span className="text-foreground truncate flex-1">{event.message}</span>
                {event.durationMs != null && (
                  <span className="text-muted-foreground shrink-0 tabular-nums">{event.durationMs}ms</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
