import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ConversationSearchProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageContent: string;
  messageRole: 'user' | 'assistant';
  matchIndex: number;
}

export function ConversationSearch({
  conversations,
  onSelectConversation,
  onClose,
}: ConversationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        const content = msg.content.toLowerCase();
        const matchIndex = content.indexOf(searchLower);
        
        if (matchIndex !== -1) {
          searchResults.push({
            conversationId: conv.id,
            conversationTitle: conv.title,
            messageContent: msg.content,
            messageRole: msg.role,
            matchIndex,
          });
        }
      });
    });

    setResults(searchResults.slice(0, 20)); // Limit results
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    // Get context around the match (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    const before = text.slice(start, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length, end);

    return (
      <span>
        {start > 0 && '...'}
        {before}
        <mark className="bg-primary/30 text-foreground rounded px-0.5">{match}</mark>
        {after}
        {end < text.length && '...'}
      </span>
    );
  };

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search all conversations..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-lg"
          autoFocus
        />
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {searchQuery && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}

        {results.map((result, index) => (
          <button
            key={`${result.conversationId}-${index}`}
            className={cn(
              "w-full text-left p-4 rounded-lg transition-colors",
              "bg-secondary/30 hover:bg-secondary/50 border border-border/50"
            )}
            onClick={() => {
              onSelectConversation(result.conversationId);
              onClose();
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
                {result.messageRole === 'user' ? 'You' : 'AI'}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {result.conversationTitle}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-2">
              {highlightMatch(result.messageContent, searchQuery)}
            </p>
          </button>
        ))}

        {!searchQuery && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Type to search through your conversations</p>
            <p className="text-xs mt-1">Search by message content or keywords</p>
          </div>
        )}
      </div>
    </div>
  );
}
