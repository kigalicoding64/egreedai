import { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    createNewChat,
    selectConversation,
    deleteConversation,
    sendMessage,
    generateImage,
    stopGeneration,
  } = useChat();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background gradient-bg">
      {/* Sidebar */}
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
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <ChatArea
        messages={activeConversation?.messages || []}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        onGenerateImage={generateImage}
        onStop={stopGeneration}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
};

export default Index;
