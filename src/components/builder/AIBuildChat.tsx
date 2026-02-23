import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BuilderComponent } from '@/types/builder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIBuildChatProps {
  onGenerate: (components: BuilderComponent[]) => void;
  existingComponents: BuilderComponent[];
}

export function AIBuildChat({ onGenerate, existingComponents }: AIBuildChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    try {
      const systemPrompt = `You are a professional web page builder AI assistant. You help users build web pages by generating component configurations.

When the user describes what they want, you MUST:
1. Respond with a friendly explanation of what you'll build
2. Then output a JSON block wrapped in \`\`\`json ... \`\`\` containing the components array

Available component types and their props:
- heading: { text, level: "h1"|"h2"|"h3"|"h4" }
- paragraph: { text }
- button: { text, href, variant: "primary"|"secondary"|"outline" }
- image: { src, alt }
- divider: {}
- spacer: { height }
- container: { maxWidth } (children array)
- grid: { columns, gap } (children array)
- navbar: { brand, links: string[] }
- hero: { title, subtitle, ctaText, bgImage? }
- footer: { links: string[], copyright }
- card: { title, description }
- testimonial: { quote, author, role }
- pricing: { plans: [{ name, price, features: string[] }] }
- faq: { items: [{ question, answer }] }
- cta: { title, subtitle, buttonText, buttonHref }
- list: { items: string[], ordered }
- input: { label, placeholder, type }
- form: { action, method } (children array)
- video: { src }

Each component needs: id (unique like "ai-1"), type, props. Optional: children, styles.
Use professional, realistic content. Build complete pages with proper structure.

Current page has ${existingComponents.length} components.`;

      const allMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...allMessages,
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limited. Please wait a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('Credits required. Please add credits.');
          return;
        }
        throw new Error('AI generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullResponse } : m);
                }
                return [...prev, { role: 'assistant', content: fullResponse }];
              });
            }
          } catch {}
        }
      }

      // Extract and apply components
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)```/) || fullResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        try {
          const components: BuilderComponent[] = JSON.parse(jsonStr);
          onGenerate(components);
          toast.success('Page updated!');
        } catch {
          toast.error('Could not parse components from AI response');
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Builder</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMessages([])}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">AI Page Builder</p>
            <p className="text-xs text-muted-foreground">Describe the page you want and I'll build it for you</p>
            <div className="mt-4 space-y-1.5">
              {[
                'Build a SaaS landing page',
                'Create a portfolio website',
                'Design an e-commerce store',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  className="block w-full text-xs text-left px-3 py-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === 'user' ? "justify-end" : "")}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={cn(
              "rounded-lg px-3 py-2 text-xs max-w-[85%]",
              msg.role === 'user'
                ? "bg-primary text-primary-foreground"
                : "bg-muted prose prose-xs prose-sm dark:prose-invert max-w-none"
            )}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => <pre className="hidden">{children}</pre>,
                    code: ({ children, className }) => {
                      if (className?.includes('json')) return null;
                      return <code className="text-xs bg-background/50 px-1 rounded">{children}</code>;
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe what to build..."
            className="min-h-[40px] max-h-[100px] text-xs resize-none"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
