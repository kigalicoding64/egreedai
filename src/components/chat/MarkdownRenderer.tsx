import ReactMarkdown from 'react-markdown';
import { Info, Lightbulb, AlertTriangle, CheckCircle2, XCircle, StickyNote } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils';

const CALLOUTS: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string; label: string }> = {
  NOTE: { icon: StickyNote, className: 'border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-300', label: 'Note' },
  INFO: { icon: Info, className: 'border-sky-500/40 bg-sky-500/5 text-sky-600 dark:text-sky-300', label: 'Info' },
  TIP: { icon: Lightbulb, className: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300', label: 'Tip' },
  SUCCESS: { icon: CheckCircle2, className: 'border-green-500/40 bg-green-500/5 text-green-600 dark:text-green-300', label: 'Success' },
  WARNING: { icon: AlertTriangle, className: 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-300', label: 'Warning' },
  ERROR: { icon: XCircle, className: 'border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-300', label: 'Error' },
  DANGER: { icon: XCircle, className: 'border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-300', label: 'Danger' },
};

function extractCallout(children: React.ReactNode): { type: string; nodes: React.ReactNode } | null {
  const arr = Array.isArray(children) ? children : [children];
  // Find first text-ish content
  for (const c of arr) {
    if (typeof c === 'string') {
      const m = c.match(/^\s*\[!(\w+)\]\s*/);
      if (m && CALLOUTS[m[1].toUpperCase()]) {
        const type = m[1].toUpperCase();
        const rest = c.slice(m[0].length);
        const remaining = arr.map((x) => (x === c ? rest : x));
        return { type, nodes: remaining };
      }
    }
    // React element wrapping text (e.g. <p>)
    if (c && typeof c === 'object' && 'props' in (c as any)) {
      const inner = (c as any).props?.children;
      const nested = extractCallout(inner);
      if (nested) return nested;
    }
    break;
  }
  return null;
}


interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = codeString.includes('\n') || (match && language);

            if (isBlock && language) {
              return <CodeBlock language={language} code={codeString} />;
            }

            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-secondary text-primary font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mb-2 mt-3">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border border-border rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 bg-secondary text-left font-semibold border-b border-border">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 border-b border-border/50">
                {children}
              </td>
            );
          },
          hr() {
            return <hr className="my-4 border-border" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
