import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, ExternalLink, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
}

const EXT_MAP: Record<string, string> = {
  javascript: 'js', typescript: 'ts', jsx: 'jsx', tsx: 'tsx',
  python: 'py', bash: 'sh', shell: 'sh', html: 'html', css: 'css',
  json: 'json', yaml: 'yml', sql: 'sql', markdown: 'md', go: 'go',
  rust: 'rs', java: 'java', c: 'c', cpp: 'cpp', php: 'php', ruby: 'rb',
};

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = EXT_MAP[language.toLowerCase()] ?? 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPreviewable = ['html', 'jsx', 'tsx'].includes(language.toLowerCase());
  const lineCount = code.split('\n').length;

  const getPreviewHtml = () => {
    if (language.toLowerCase() === 'html') return code;
    return `<!DOCTYPE html><html><head><style>body{font-family:system-ui;padding:20px;background:#1a1a2e;color:#fff}</style></head><body><pre>${code
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre></body></html>`;
  };

  return (
    <div
      className={cn(
        'my-3 rounded-lg overflow-hidden bg-background/50 border border-border/50',
        fullscreen && 'fixed inset-4 z-50 my-0 flex flex-col shadow-2xl',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <span className="text-xs font-mono text-muted-foreground uppercase">{language}</span>
          <span className="text-xs text-muted-foreground/70">· {lineCount} lines</span>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? 'Hide preview' : 'Run preview'}
            >
              {showPreview ? <ExternalLink className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div className={cn('overflow-auto', fullscreen ? 'flex-1' : showPreview && 'max-h-[240px]')}>
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={oneDark}
          showLineNumbers={lineCount > 3}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.85rem',
          }}
          lineNumberStyle={{ color: 'hsl(var(--muted-foreground) / 0.5)', minWidth: '2em' }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {showPreview && isPreviewable && !fullscreen && (
        <div className="border-t border-border/50">
          <div className="px-3 py-1.5 bg-secondary/30 text-xs text-muted-foreground">Preview</div>
          <iframe
            srcDoc={getPreviewHtml()}
            className="w-full h-[240px] border-0 bg-white"
            sandbox="allow-scripts"
            title="Code preview"
          />
        </div>
      )}
    </div>
  );
}
