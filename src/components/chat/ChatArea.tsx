import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatInput } from './ChatInput';
import { Menu, Moon, Sun, LogIn, LogOut, Download, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { exportToText, exportToPDF } from '@/utils/exportChat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, imageUrl?: string) => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<string | null>;
  onStop?: () => void;
  onToggleSidebar: () => void;
  voiceModeActive?: boolean;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onGenerateImage,
  onFileUpload,
  onStop,
  onToggleSidebar,
  voiceModeActive = false,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
    } else {
      navigate('/auth');
    }
  };

  const handleExportText = () => {
    const title = messages.length > 0 
      ? messages[0].content.substring(0, 30) 
      : 'Chat Export';
    exportToText(messages, title);
  };

  const handleExportPDF = () => {
    const title = messages.length > 0 
      ? messages[0].content.substring(0, 30) 
      : 'Chat Export';
    exportToPDF(messages, title);
  };

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
            {user ? `Signed in as ${user.email}` : `${messages.length} messages`}
          </p>
        </div>

        {/* Export Button */}
        {messages.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-all duration-300 hover:bg-primary/10"
                title="Export chat"
              >
                <Download className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportText}>
                <FileText className="w-4 h-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <File className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="transition-all duration-300 hover:bg-primary/10"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </Button>

        {/* Auth Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAuthClick}
          className="transition-all duration-300 hover:bg-primary/10"
          title={user ? 'Sign out' : 'Sign in'}
        >
          {user ? (
            <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <LogIn className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <WelcomeScreen onPromptClick={onSendMessage} />
        ) : (
          <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                autoSpeak={voiceModeActive && index === messages.length - 1}
              />
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
        onFileUpload={onFileUpload}
        isLoading={isLoading}
        onStop={onStop}
      />
    </div>
  );
}
