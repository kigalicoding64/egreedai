import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatInput } from './ChatInput';
import { VideoGenerator } from './VideoGenerator';
import { LanguageSelector, Language, SUPPORTED_LANGUAGES } from './LanguageSelector';
import { WebSearchIndicator } from './WebSearchIndicator';
import { Menu, Moon, Sun, LogIn, LogOut, Download, FileText, File, Video, Settings, Code2, BookOpen } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { exportToText, exportToPDF } from '@/utils/exportChat';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isSearching?: boolean;
  onSendMessage: (message: string, imageUrl?: string) => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<string | null>;
  onStop?: () => void;
  onToggleSidebar: () => void;
  voiceModeActive?: boolean;
  selectedLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
  modelId?: string;
  onSelectModel?: (id: string) => void;
  useKnowledge?: boolean;
  onToggleKnowledge?: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  isSearching = false,
  onSendMessage,
  onGenerateImage,
  onFileUpload,
  onStop,
  onToggleSidebar,
  voiceModeActive = false,
  selectedLanguage = SUPPORTED_LANGUAGES[0],
  onLanguageChange,
  modelId = 'egreed-fast',
  onSelectModel,
  useKnowledge = false,
  onToggleKnowledge,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);

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
    const title = messages.length > 0 ? messages[0].content.substring(0, 30) : 'Chat Export';
    exportToText(messages, title);
  };

  const handleExportPDF = () => {
    const title = messages.length > 0 ? messages[0].content.substring(0, 30) : 'Chat Export';
    exportToPDF(messages, title);
  };

  const handleVideoGenerated = (videoUrl: string, prompt: string) => {
    onSendMessage(`🎬 Generated video: ${prompt}`, videoUrl);
    toast.success('Video generated and added to chat!');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {showVideoGenerator && (
        <VideoGenerator
          onClose={() => setShowVideoGenerator(false)}
          onVideoGenerated={handleVideoGenerated}
        />
      )}

      <header className="glass border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
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

        {onSelectModel && (
          <ModelSelector selectedId={modelId} onSelect={onSelectModel} />
        )}

        {onToggleKnowledge && (
          <Toggle
            pressed={useKnowledge}
            onPressedChange={onToggleKnowledge}
            size="sm"
            title="Use my Knowledge Base"
            aria-label="Use Knowledge Base"
          >
            <BookOpen className="w-4 h-4" />
          </Toggle>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/knowledge')}
          className="transition-all duration-300 hover:bg-primary/10"
          title="Manage Knowledge Base"
        >
          <BookOpen className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/builder')}
          className="transition-all duration-300 hover:bg-primary/10"
          title="No-Code Builder"
        >
          <Code2 className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVideoGenerator(true)}
          className="transition-all duration-300 hover:bg-primary/10"
          title="Generate video"
        >
          <Video className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>

        {onLanguageChange && (
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            compact
          />
        )}

        {messages.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="transition-all duration-300 hover:bg-primary/10" title="Export chat">
                <Download className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportText}>
                <FileText className="w-4 h-4 mr-2" />Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <File className="w-4 h-4 mr-2" />Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="transition-all duration-300 hover:bg-primary/10" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
        </Button>

        {user && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/settings')} 
            className="transition-all duration-300 hover:bg-primary/10"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={handleAuthClick} className="transition-all duration-300 hover:bg-primary/10" title={user ? 'Sign out' : 'Sign in'}>
          {user ? <LogOut className="w-5 h-5 text-muted-foreground" /> : <LogIn className="w-5 h-5 text-muted-foreground" />}
        </Button>
      </header>

      {/* Web Search Indicator */}
      {isSearching && <WebSearchIndicator isSearching={true} />}

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
            {isLoading && <TypingIndicator isSearching={isSearching} />}
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
