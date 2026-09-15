import { ChevronDown, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

type Props = {
  open: boolean;
  onOpen: (open: boolean) => void;
  playing: boolean;
  onPlaying: (playing: boolean) => void;
  t: number;
  duration: number;
};

export function Timeline({ open, onOpen, playing, onPlaying, t, duration }: Props) {
  const x = duration > 0 ? Math.min(1, t / duration) : 0;
  return (
    <section
      className="flex shrink-0 flex-col overflow-hidden rounded-xl"
      style={{ background: 'var(--panel)', boxShadow: 'var(--shadow-panel)' }}
    >
      <div className="flex h-8 items-center gap-1 px-2">
        <Button variant="icon" size="icon" onClick={() => onPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <Pause className="size-[14px]" strokeWidth={1.5} />
          ) : (
            <Play className="size-[14px]" strokeWidth={1.5} />
          )}
        </Button>
        <span className="text-[11px] text-inactive">Orbit</span>
        <span className="tabular ml-1 text-[11px] text-muted-foreground">{t.toFixed(2)}s</span>
        <button
          type="button"
          className="ml-auto text-inactive hover:text-foreground"
          onClick={() => onOpen(!open)}
          aria-label={open ? 'Collapse timeline' : 'Expand timeline'}
        >
          <ChevronDown className={cn('size-[14px] transition-transform', !open && '-rotate-90')} strokeWidth={1.5} />
        </button>
      </div>
      {open && (
        <div className="relative mx-2 mb-2 h-10 overflow-hidden rounded-md bg-well">
          <div className="absolute inset-y-0 left-0 flex items-center gap-8 px-2 text-[10px] text-inactive">
            <span>0</span>
            <span>0.5</span>
            <span>1.0</span>
            <span>1.5</span>
            <span>2.0</span>
            <span>2.5</span>
            <span>3.0</span>
            <span>3.5</span>
            <span>4.0</span>
          </div>
          <div
            className="absolute top-1/2 h-3 w-[40%] -translate-y-1/2 rounded-full bg-lane"
            style={{ left: '8%' }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-accent-brand"
            style={{ left: `${8 + x * 84}%` }}
          >
            <div className="absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent-brand" />
          </div>
        </div>
      )}
    </section>
  );
}
