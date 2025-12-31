import { Sparkles, Code, FileText, Lightbulb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: 'Write code',
    prompt: 'Help me write a React component for a user profile card with animations',
  },
  {
    icon: FileText,
    title: 'Analyze text',
    prompt: 'Explain the key concepts of machine learning in simple terms',
  },
  {
    icon: Lightbulb,
    title: 'Brainstorm ideas',
    prompt: 'Give me 10 creative startup ideas for the AI industry',
  },
  {
    icon: Zap,
    title: 'Solve problems',
    prompt: 'Help me debug this code and explain what went wrong',
  },
];

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center mx-auto mb-6 glow-primary">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold gradient-text mb-2">EgreedAI</h1>
        <p className="text-muted-foreground text-lg">
          Your advanced AI assistant for everything
        </p>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex items-start gap-3 text-left glass glass-hover border-border/50 hover:border-primary/50 group"
            onClick={() => onPromptClick(suggestion.prompt)}
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <suggestion.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground mb-1">
                {suggestion.title}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.prompt}
              </p>
            </div>
          </Button>
        ))}
      </div>

      {/* Features */}
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Code Generation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span>Data Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Creative Writing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Problem Solving</span>
        </div>
      </div>
    </div>
  );
}
