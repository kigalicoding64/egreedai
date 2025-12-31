import { useState, useCallback } from 'react';
import { Message, Conversation } from '@/types/chat';

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (content: string) => {
  return content.length > 40 ? content.substring(0, 40) + '...' : content;
};

// Simulated AI response - In production, this would call an actual AI API
const generateAIResponse = async (userMessage: string): Promise<string> => {
  // Simulate typing delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

  const responses = [
    `That's a great question! Let me help you with "${userMessage.substring(0, 50)}..."\n\nHere's what I think:\n\n1. **Understanding the context** - First, let's break down what you're asking.\n\n2. **Key considerations** - There are several important factors to consider.\n\n3. **My recommendation** - Based on my analysis, here's what I suggest.\n\nWould you like me to elaborate on any of these points?`,
    
    `I'd be happy to assist with that! Here's a comprehensive response:\n\n**Summary**\nYour question touches on an interesting topic. Let me provide some insights.\n\n**Details**\n- Point 1: This is fundamental to understanding the concept\n- Point 2: Building on the first point, we can see that...\n- Point 3: Finally, consider this perspective\n\n**Conclusion**\nI hope this helps! Feel free to ask follow-up questions.`,
    
    `Great question! Here's my take:\n\n\`\`\`javascript\n// Example code to illustrate\nfunction example() {\n  const result = processData();\n  return result;\n}\n\`\`\`\n\nThe code above demonstrates the concept. Let me know if you need more clarification!`,
    
    `I understand what you're looking for. Let me break this down:\n\n🎯 **Goal**: ${userMessage.substring(0, 30)}...\n\n📝 **Steps to achieve this**:\n1. First, analyze the requirements\n2. Then, plan the implementation\n3. Finally, execute and iterate\n\n💡 **Pro tip**: Always test your assumptions before committing to a solution.\n\nIs there anything specific you'd like me to focus on?`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const createNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      let conversationId = activeConversationId;

      // Create new conversation if none exists
      if (!conversationId) {
        const newConversation: Conversation = {
          id: generateId(),
          title: generateTitle(content),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConversation, ...prev]);
        conversationId = newConversation.id;
        setActiveConversationId(conversationId);
      }

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            const updatedMessages = [...c.messages, userMessage];
            return {
              ...c,
              messages: updatedMessages,
              title: c.messages.length === 0 ? generateTitle(content) : c.title,
              updatedAt: new Date(),
            };
          }
          return c;
        })
      );

      // Generate AI response
      setIsLoading(true);
      try {
        const aiResponseContent = await generateAIResponse(content);
        const aiMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: aiResponseContent,
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: [...c.messages, aiMessage],
                updatedAt: new Date(),
              };
            }
            return c;
          })
        );
      } catch (error) {
        console.error('Error generating response:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId]
  );

  const stopGeneration = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    createNewChat,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopGeneration,
  };
}
