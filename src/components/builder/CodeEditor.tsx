import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, FileCode, FileType, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface CodeEditorProps {
  htmlCode: string;
  reactCode: string;
  onHtmlChange?: (html: string) => void;
}

export function CodeEditor({ htmlCode, reactCode, onHtmlChange }: CodeEditorProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('html');
  const [editableHtml, setEditableHtml] = useState(htmlCode);

  useEffect(() => {
    setEditableHtml(htmlCode);
  }, [htmlCode]);

  const copyToClipboard = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const extractCSS = (html: string): string => {
    const match = html.match(/<style>([\s\S]*?)<\/style>/);
    return match ? match[1].trim() : '';
  };

  const cssCode = extractCSS(htmlCode);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[hsl(var(--muted)/0.3)]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <TabsList className="h-8 bg-muted">
            <TabsTrigger value="html" className="text-xs h-7 gap-1.5">
              <FileCode className="w-3 h-3" /> HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="text-xs h-7 gap-1.5">
              <FileType className="w-3 h-3" /> CSS
            </TabsTrigger>
            <TabsTrigger value="react" className="text-xs h-7 gap-1.5">
              <FileJson className="w-3 h-3" /> React
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => copyToClipboard(
                activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : reactCode,
                activeTab.toUpperCase()
              )}
            >
              {copied === activeTab.toUpperCase() ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copy
            </Button>
          </div>
        </div>

        <TabsContent value="html" className="flex-1 m-0 overflow-auto">
          <textarea
            value={editableHtml}
            onChange={(e) => {
              setEditableHtml(e.target.value);
              onHtmlChange?.(e.target.value);
            }}
            className="w-full h-full bg-card text-foreground font-mono text-xs p-4 resize-none border-0 outline-none leading-relaxed"
            spellCheck={false}
          />
        </TabsContent>
        <TabsContent value="css" className="flex-1 m-0 overflow-auto">
          <pre className="w-full h-full bg-card text-foreground font-mono text-xs p-4 leading-relaxed whitespace-pre-wrap">
            {cssCode || '/* No custom CSS */'}
          </pre>
        </TabsContent>
        <TabsContent value="react" className="flex-1 m-0 overflow-auto">
          <pre className="w-full h-full bg-card text-foreground font-mono text-xs p-4 leading-relaxed whitespace-pre-wrap">
            {reactCode}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
