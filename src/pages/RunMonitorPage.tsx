import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRunProgress, useStopRun, useResumeRun, useRetryItems } from '../hooks/useRun';
import { ArrowLeft, Square, Play, RotateCcw, Download } from 'lucide-react';

export function RunMonitorPage() {
  const { runId } = useParams<{ runId: string }>();
  const [sinceId, setSinceId] = useState<number | null>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const { data } = useRunProgress(runId, sinceId);
  const stopRun = useStopRun();
  const resumeRun = useResumeRun();
  const retryItems = useRetryItems(runId ?? '');

  // Append new events
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

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [allEvents]);

  if (!data) {
    return <div className="p-6 text-muted-foreground">Loading run...</div>;
  }

  const { run } = data;
  const progress = run.totalItems > 0
    ? ((run.completedItems + run.failedItems + run.skippedItems) / run.totalItems * 100)
    : 0;
  const isActive = run.status === 'queuing' || run.status === 'processing';
  const isStopped = run.status === 'stopped';
  const isTerminal = run.status === 'completed' || run.status === 'failed';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/lists`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Run Monitor</h1>
            <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              run.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
              run.status === 'queuing' ? 'bg-yellow-500/20 text-yellow-400' :
              run.status === 'stopped' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {run.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isActive && (
            <button onClick={() => stopRun.mutate(runId!)} disabled={stopRun.isPending}
              className="flex items-center gap-2 rounded-md bg-destructive/20 px-4 py-2 text-sm text-destructive hover:bg-destructive/30 disabled:opacity-50">
              <Square className="h-4 w-4" /> Stop
            </button>
          )}
          {isStopped && (
            <button onClick={() => resumeRun.mutate(runId!)} disabled={resumeRun.isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {(isTerminal || isStopped) && run.failedItems > 0 && (
            <button onClick={() => retryItems.mutate({ filter: { status: 'failed' } })} disabled={retryItems.isPending}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50">
              <RotateCcw className="h-4 w-4" /> Retry Failed ({run.failedItems})
            </button>
          )}
          {isTerminal && (
            <button onClick={() => window.open(`/api/runs/${runId}/export`, '_blank')}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {run.errorMessage && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {run.errorMessage}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {run.completedItems + run.failedItems + run.skippedItems} / {run.totalItems} items
          </span>
          <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Counters */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Completed', value: run.completedItems, color: 'text-green-400' },
            { label: 'Failed', value: run.failedItems, color: 'text-red-400' },
            { label: 'Skipped', value: run.skippedItems, color: 'text-yellow-400' },
            { label: 'Cost', value: `$${parseFloat(run.totalCostUsd).toFixed(4)}`, color: 'text-foreground' },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-border p-3 text-center">
              <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Event Log</h2>
        <div
          ref={logRef}
          className="h-80 overflow-y-auto rounded-lg border border-border bg-card p-3 font-mono text-xs space-y-0.5"
        >
          {allEvents.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              {isActive ? 'Waiting for events...' : 'No events.'}
            </div>
          ) : (
            allEvents.map((event) => (
              <div key={event.id} className="flex gap-3">
                <span className="text-muted-foreground shrink-0">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 ${
                  event.status === 'success' ? 'text-green-400' :
                  event.status === 'failed' ? 'text-red-400' :
                  event.status === 'cached' ? 'text-blue-400' :
                  'text-yellow-400'
                }`}>
                  [{event.step}]
                </span>
                <span className="text-foreground truncate">{event.message}</span>
                {event.durationMs != null && (
                  <span className="text-muted-foreground shrink-0">{event.durationMs}ms</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
