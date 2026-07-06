import { useEffect, useState } from 'react';
import { Sparkles, Brain, Search, Lightbulb, PenLine, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minMs: number;
}

const DEFAULT_PHASES: Phase[] = [
  { label: 'Understanding', icon: Brain, minMs: 0 },
  { label: 'Thinking', icon: Sparkles, minMs: 1200 },
  { label: 'Planning', icon: Lightbulb, minMs: 3200 },
  { label: 'Generating', icon: PenLine, minMs: 6000 },
  { label: 'Reviewing', icon: CheckCircle2, minMs: 12000 },
];

const SEARCH_PHASES: Phase[] = [
  { label: 'Searching the web', icon: Search, minMs: 0 },
  { label: 'Reading results', icon: Search, minMs: 1800 },
  { label: 'Synthesizing', icon: Brain, minMs: 4500 },
];

interface TypingIndicatorProps {
  isSearching?: boolean;
  toolLabel?: string;
}

export function TypingIndicator({ isSearching = false, toolLabel }: TypingIndicatorProps) {
  const phases = isSearching ? SEARCH_PHASES : DEFAULT_PHASES;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(id);
  }, [isSearching]);

  const current =
    [...phases].reverse().find((p) => elapsed >= p.minMs) ?? phases[0];
  const Icon = current.icon;
  const label = toolLabel ?? current.label;

  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center flex-shrink-0 glow-sm">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
        <span className="absolute inset-0 rounded-xl border border-primary/40 animate-ping" />
      </div>
      <div className="glass rounded-2xl rounded-tl-md px-4 py-3 border border-border/60 min-w-[220px]">
        <div className="flex items-center gap-2.5">
          <Icon className={cn('w-4 h-4 text-primary', 'animate-pulse')} />
          <span className="text-sm font-medium bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_2.4s_linear_infinite]">
            {label}
          </span>
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin ml-auto" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {phases.map((p, i) => {
            const active = elapsed >= p.minMs;
            const isCurrent = p.label === current.label;
            return (
              <div
                key={p.label}
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  isCurrent ? 'w-8 bg-primary' : active ? 'w-4 bg-primary/60' : 'w-4 bg-muted',
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
