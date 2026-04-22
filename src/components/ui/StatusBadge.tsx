import { cn } from '../../lib/utils';

const statusStyles: Record<string, { label: string; className: string; dot: string }> = {
  queuing: { label: 'Queuing', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300', dot: 'bg-amber-300 animate-pulse' },
  processing: { label: 'Processing', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300', dot: 'bg-sky-300 animate-pulse' },
  completed: { label: 'Completed', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  stopped: { label: 'Stopped', className: 'border-orange-500/30 bg-orange-500/10 text-orange-300', dot: 'bg-orange-300' },
  failed: { label: 'Failed', className: 'border-red-500/35 bg-red-500/10 text-red-400', dot: 'bg-red-400' },
  skipped: { label: 'Skipped', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300', dot: 'bg-yellow-300' },
  scraping: { label: 'Scraping', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300', dot: 'bg-sky-300 animate-pulse' },
  classifying: { label: 'Classifying', className: 'border-violet-500/30 bg-violet-500/10 text-violet-300', dot: 'bg-violet-300 animate-pulse' },
  retrying: { label: 'Retrying', className: 'border-amber-500/30 bg-amber-500/10 text-amber-300', dot: 'bg-amber-300 animate-pulse' },
  pending: { label: 'Pending', className: 'border-border bg-secondary text-muted-foreground', dot: 'bg-muted-foreground' },
  ready: { label: 'Ready', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  importing: { label: 'Importing', className: 'border-sky-500/30 bg-sky-500/10 text-sky-300', dot: 'bg-sky-300 animate-pulse' },
  import_failed: { label: 'Failed', className: 'border-red-500/35 bg-red-500/10 text-red-400', dot: 'bg-red-400' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = statusStyles[status] ?? {
    label: status,
    className: 'border-border bg-secondary text-muted-foreground',
    dot: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase leading-none tracking-[0.16em]',
        style.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}
