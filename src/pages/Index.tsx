import { useState, useCallback, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { useChat } from '@/hooks/useChat';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { Language, SUPPORTED_LANGUAGES } from '@/components/chat/LanguageSelector';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const searchTriggerRef = useRef<(() => void) | null>(null);
  
  const {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    isSearching,
    createNewChat,
    selectConversation,
    deleteConversation,
    sendMessage,
    generateImage,
    uploadFile,
    stopGeneration,
  } = useChat();

  useKeyboardShortcuts({
    onNewChat: createNewChat,
    onSearch: useCallback(() => searchTriggerRef.current?.(), []),
    onToggleVoice: useCallback(() => setVoiceModeActive(v => !v), []),
    onToggleSidebar: useCallback(() => setSidebarOpen(v => !v), []),
  });

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background gradient-bg">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        )}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={createNewChat}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onSearchTrigger={(fn) => { searchTriggerRef.current = fn; }}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ChatArea
        messages={activeConversation?.messages || []}
        isLoading={isLoading}
        isSearching={isSearching}
        onSendMessage={sendMessage}
        onGenerateImage={generateImage}
        onFileUpload={uploadFile}
        onStop={stopGeneration}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        voiceModeActive={voiceModeActive}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
    </div>
  );
};

export default Index;
