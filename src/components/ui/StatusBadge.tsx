import { cn } from '../../lib/utils';

const statusStyles: Record<string, { label: string; className: string; dot: string }> = {
  // Run statuses
  queuing: { label: 'Queuing', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400 animate-pulse' },
  processing: { label: 'Processing', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400 animate-pulse' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  stopped: { label: 'Stopped', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
  failed: { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  skipped: { label: 'Skipped', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' },
  scraping: { label: 'Scraping', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400 animate-pulse' },
  classifying: { label: 'Classifying', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400 animate-pulse' },
  retrying: { label: 'Retrying', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400 animate-pulse' },
  pending: { label: 'Pending', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
  // List statuses
  ready: { label: 'Ready', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  importing: { label: 'Importing', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400 animate-pulse' },
  import_failed: { label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = statusStyles[status] ?? { label: status, className: 'bg-secondary text-muted-foreground border-border', dot: 'bg-muted-foreground' };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
      style.className,
      className
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}
