import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center flex-shrink-0 glow-sm">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
