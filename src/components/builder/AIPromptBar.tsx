import { useState } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BuilderComponent } from '@/types/builder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIPromptBarProps {
  onGenerate: (components: BuilderComponent[]) => void;
  existingComponents: BuilderComponent[];
}

export function AIPromptBar({ onGenerate, existingComponents }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const systemPrompt = `You are a web page builder AI. The user will describe a page they want, and you must return a JSON array of components.

Available component types and their props:
- heading: { text: string, level: "h1"|"h2"|"h3"|"h4" }
- paragraph: { text: string }
- button: { text: string, href: string, variant: "primary"|"secondary"|"outline" }
- image: { src: string, alt: string }
- divider: {}
- spacer: { height: string }
- container: { maxWidth: string } (can have children array)
- grid: { columns: number, gap: string } (can have children array)
- navbar: { brand: string, links: string[] }
- hero: { title: string, subtitle: string, ctaText: string, bgImage?: string }
- footer: { brand?: string, links: string[], copyright: string }
- card: { title: string, description: string }
- testimonial: { quote: string, author: string, role: string }
- pricing: { plans: [{ name: string, price: string, features: string[] }] }
- faq: { items: [{ question: string, answer: string }] }
- cta: { title: string, subtitle: string, buttonText: string, buttonHref: string }
- list: { items: string[], ordered: boolean }
- input: { label: string, placeholder: string, type: string }

Each component must have: id (unique string), type, props. Optional: children (array), styles (object).

Rules:
- Generate realistic, professional content
- Use unique IDs (e.g., "ai-1", "ai-2", etc.)
- Use proper hierarchy (navbar at top, footer at bottom)
- Make content relevant to the user's prompt
- Return ONLY the JSON array, no markdown or explanation

${existingComponents.length > 0 ? `The page currently has ${existingComponents.length} components. Generate new components to add or replace.` : 'Generate a complete page.'}`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.notConfigured) {
          throw new Error('LLM not configured. Add your Llama Stack URL in secrets to enable AI builder.');
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
            if (content) fullResponse += content;
          } catch {}
        }
      }

      // Parse the JSON from the response
      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Could not parse AI response as components');

      const components: BuilderComponent[] = JSON.parse(jsonMatch[0]);
      onGenerate(components);
      setPrompt('');
      toast.success('Page generated successfully!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate page. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">AI Page Generator</span>
      </div>
      <div className="flex gap-2">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the page you want to build... e.g., 'Create a landing page for a fitness app with pricing and testimonials'"
          className="min-h-[60px] text-sm resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
        />
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="self-end"
          size="sm"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
