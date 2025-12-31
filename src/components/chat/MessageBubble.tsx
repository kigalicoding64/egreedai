import { User, Sparkles, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple code block detection and formatting
  const formatContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: (string | { lang: string; code: string })[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push({ lang: match[1] || 'code', code: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  const formattedContent = formatContent(message.content);

  return (
    <div
      className={cn(
        "group flex gap-4 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-secondary"
            : "bg-gradient-to-br from-primary to-teal-400 glow-sm"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[80%] space-y-2",
          isUser ? "flex flex-col items-end" : ""
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "glass rounded-tl-sm"
          )}
        >
          <div className="prose prose-sm prose-invert max-w-none">
            {formattedContent.map((part, i) => {
              if (typeof part === 'string') {
                return (
                  <p key={i} className="whitespace-pre-wrap m-0 leading-relaxed">
                    {part}
                  </p>
                );
              } else {
                return (
                  <div key={i} className="my-3 rounded-lg overflow-hidden bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/50 border-b border-border/50">
                      <span className="text-xs font-mono text-muted-foreground">
                        {part.lang}
                      </span>
                    </div>
                    <pre className="p-3 overflow-x-auto">
                      <code className="text-sm font-mono">{part.code}</code>
                    </pre>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
