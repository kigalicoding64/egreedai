import { useMemo } from 'react';
import {
  Sparkles,
  Code2,
  Search,
  Image as ImageIcon,
  FileText,
  Globe,
  Presentation,
  Languages,
  Briefcase,
  Megaphone,
  Mic,
  AppWindow,
  Video,
  Cloud,
  PenLine,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const actions = [
  { icon: PenLine,       title: 'Write',            prompt: 'Help me write a polished blog post about ',                                          tint: 'from-emerald-400/20 to-teal-400/10' },
  { icon: Code2,         title: 'Code',             prompt: 'Write a clean, production-ready implementation of ',                                 tint: 'from-teal-400/20 to-cyan-400/10' },
  { icon: Search,        title: 'Research',         prompt: 'Do a deep research pass on this topic and summarise the key findings: ',             tint: 'from-emerald-400/20 to-emerald-600/10' },
  { icon: ImageIcon,     title: 'Generate Image',   prompt: 'Generate an image of ',                                                              tint: 'from-teal-500/20 to-emerald-400/10' },
  { icon: FileText,      title: 'Analyze PDF',      prompt: 'I will upload a PDF. Summarise it and extract the key insights.',                    tint: 'from-emerald-300/20 to-teal-500/10' },
  { icon: Globe,         title: 'Search Web',       prompt: 'Search the web and give me the latest on ',                                          tint: 'from-cyan-400/20 to-teal-400/10' },
  { icon: AppWindow,     title: 'Build Website',    prompt: 'Design and generate a modern landing page for ',                                     tint: 'from-emerald-500/20 to-teal-600/10' },
  { icon: Presentation,  title: 'Presentation',     prompt: 'Create a 10-slide presentation outline about ',                                      tint: 'from-teal-400/20 to-emerald-300/10' },
  { icon: BookOpen,      title: 'Summarize',        prompt: 'Summarise the following in clean bullet points: ',                                   tint: 'from-emerald-400/20 to-teal-500/10' },
  { icon: Languages,     title: 'Translate',        prompt: 'Translate the following, keeping tone and nuance: ',                                 tint: 'from-teal-300/20 to-emerald-500/10' },
  { icon: Briefcase,     title: 'Business Plan',    prompt: 'Draft a lean business plan for ',                                                    tint: 'from-emerald-500/20 to-teal-400/10' },
  { icon: Megaphone,     title: 'Marketing',        prompt: 'Write a 30-day marketing plan for ',                                                 tint: 'from-teal-500/20 to-cyan-400/10' },
  { icon: Mic,           title: 'Voice Chat',       prompt: 'Let’s have a natural voice conversation about ',                                     tint: 'from-emerald-400/20 to-emerald-600/10' },
  { icon: AppWindow,     title: 'Create App',       prompt: 'Scaffold a small React app that ',                                                   tint: 'from-teal-400/20 to-emerald-500/10' },
  { icon: Video,         title: 'Generate Video',   prompt: 'Generate a short video concept about ',                                              tint: 'from-emerald-500/20 to-teal-500/10' },
  { icon: Cloud,         title: 'Store in ECloud',  prompt: 'Save this conversation to my ECloud workspace.',                                     tint: 'from-teal-500/20 to-emerald-400/10' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  const { user } = useAuth();
  const greeting = useMemo(getGreeting, []);
  const name =
    (user?.user_metadata as { display_name?: string; full_name?: string } | undefined)?.display_name ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split('@')[0];

  return (
    <div className="relative flex-1 overflow-y-auto scrollbar-thin">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -right-32 w-[420px] h-[420px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 animate-fade-in">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/20 text-xs text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-subtle" />
            EGreedAI · Online · Africa-first intelligence
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center mx-auto mb-6 glow-primary">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">
            <span className="text-foreground">{greeting}</span>
            {name && <span className="text-muted-foreground">, {name}</span>}
          </h1>
          <p className="text-lg text-muted-foreground">
            What would you like to create today?
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {actions.map((a, i) => (
            <button
              key={a.title}
              onClick={() => onPromptClick(a.prompt)}
              className="group relative text-left p-4 rounded-2xl glass border border-border/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${a.tint} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 border border-border/50 flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/30 transition-colors">
                  <a.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {a.title}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Tip: press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/50 text-[10px]">⌘K</kbd> to search, <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/50 text-[10px]">⌘⇧N</kbd> for a new chat.
        </p>
      </div>
    </div>
  );
}
