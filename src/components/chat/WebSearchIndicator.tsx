import { Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebSearchIndicatorProps {
  isSearching?: boolean;
  results?: WebSearchResult[];
  query?: string;
}

export function WebSearchIndicator({ isSearching, results, query }: WebSearchIndicatorProps) {
  if (!isSearching && !results?.length) return null;

  return (
    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <div className="flex items-center gap-2 mb-2">
        <Globe className={cn("w-4 h-4 text-blue-500", isSearching && "animate-spin")} />
        <span className="text-sm font-medium text-blue-500">
          {isSearching ? `Searching the web for "${query}"...` : 'Web Search Results'}
        </span>
      </div>

      {results && results.length > 0 && (
        <div className="space-y-2 mt-3">
          {results.slice(0, 3).map((result, index) => (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.snippet}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
