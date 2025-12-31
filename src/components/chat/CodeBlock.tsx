import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPreviewable = ['html', 'jsx', 'tsx'].includes(language.toLowerCase());
  
  // Generate preview HTML for HTML/JSX code
  const getPreviewHtml = () => {
    if (language.toLowerCase() === 'html') {
      return code;
    }
    // For JSX/TSX, wrap in basic HTML structure
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; background: #1a1a2e; color: #fff; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          <div id="preview">
            ${code.replace(/<\/?[A-Z][^>]*>/g, (match) => {
              // Convert JSX to HTML-like display
              return `<div style="padding: 10px; border: 1px dashed #444; margin: 5px 0; border-radius: 4px;">
                <code style="color: #00d9ff;">${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
              </div>`;
            })}
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden bg-background/50 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border/50">
        <span className="text-xs font-mono text-muted-foreground uppercase">
          {language}
        </span>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? (
                <ExternalLink className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className={cn("overflow-x-auto", showPreview && "max-h-[200px]")}>
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Preview */}
      {showPreview && isPreviewable && (
        <div className="border-t border-border/50">
          <div className="px-3 py-1.5 bg-secondary/30 text-xs text-muted-foreground">
            Preview
          </div>
          <div className="bg-white dark:bg-gray-900 min-h-[100px] max-h-[300px] overflow-auto">
            <iframe
              srcDoc={getPreviewHtml()}
              className="w-full h-[200px] border-0"
              sandbox="allow-scripts"
              title="Code preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
