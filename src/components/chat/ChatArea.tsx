import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatInput } from './ChatInput';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  onStop?: () => void;
  onToggleSidebar: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onGenerateImage,
  onStop,
  onToggleSidebar,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-medium text-foreground">
            {messages.length > 0 ? 'Chat' : 'New conversation'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {messages.length} messages
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeScreen onPromptClick={onSendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSendMessage={onSendMessage}
        onGenerateImage={onGenerateImage}
        isLoading={isLoading}
        onStop={onStop}
      />
    </div>
  );
}
