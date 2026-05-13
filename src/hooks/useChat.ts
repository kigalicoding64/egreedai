import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatSearchResults } from '@/utils/webSearchDetection';

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (content: string) => {
  return content.length > 40 ? content.substring(0, 40) + '...' : content;
};

const WEB_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-search`;

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [modelId, setModelId] = useState<string>(() =>
    localStorage.getItem('egreed_model') || 'egreed-fast'
  );
  const [useKnowledge, setUseKnowledge] = useState<boolean>(() =>
    localStorage.getItem('egreed_use_kb') === '1'
  );
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectModel = useCallback((id: string) => {
    setModelId(id);
    localStorage.setItem('egreed_model', id);
  }, []);
  const toggleKnowledge = useCallback(() => {
    setUseKnowledge((v) => {
      const n = !v;
      localStorage.setItem('egreed_use_kb', n ? '1' : '0');
      return n;
    });
  }, []);

  // Perform web search
  const performWebSearch = async (query: string, language: string = 'en'): Promise<string | null> => {
    try {
      setIsSearching(true);
      const response = await fetch(WEB_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ query, language }),
      });

      if (!response.ok) {
        console.error('Web search failed');
        return null;
      }

      const data = await response.json();
      if (data.success && data.answer) {
        return formatSearchResults(data.answer, data.sources || []);
      }
      return null;
    } catch (error) {
      console.error('Web search error:', error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // Load conversations from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [isAuthenticated, user]);

  const loadConversations = async () => {
    if (!user) return;
    
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error loading conversations:', convError);
      return;
    }

    const conversationsWithMessages: Conversation[] = await Promise.all(
      (convData || []).map(async (conv) => {
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        return {
          id: conv.id,
          title: conv.title,
          messages: (msgData || []).map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            imageUrl: msg.image_url || undefined
          })),
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
          userId: conv.user_id
        };
      })
    );

    setConversations(conversationsWithMessages);
  };

  const createNewChat = useCallback(async () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isAuthenticated && user) {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: newConversation.title
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
      } else if (data) {
        newConversation.id = data.id;
      }
    }

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, [isAuthenticated, user]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (isAuthenticated && user) {
      await supabase.from('conversations').delete().eq('id', id);
    }
    
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [activeConversationId, isAuthenticated, user]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
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

        if (isAuthenticated && user) {
          const { data, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: newConversation.title
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating conversation:', error);
          } else if (data) {
            newConversation.id = data.id;
          }
        }

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
        imageUrl
      };

      // Save user message to database
      if (isAuthenticated && user) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content,
          image_url: imageUrl
        });

        // Update conversation title if first message
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && conv.messages.length === 0) {
          await supabase
            .from('conversations')
            .update({ title: generateTitle(content) })
            .eq('id', conversationId);
        }
      }

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

      // Get conversation messages for context
      const currentConv = conversations.find(c => c.id === conversationId);
      const messagesForApi = [
        ...(currentConv?.messages || []).map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user' as const, content }
      ];

      // LLAMA DISABLED — search-first mode. Always try web search; fall back to a friendly canned reply.
      setIsLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let assistantContent = '';
      const aiMessageId = generateId();

      setConversations((prev) =>
        prev.map((c) => c.id === conversationId
          ? { ...c, messages: [...c.messages, { id: aiMessageId, role: 'assistant' as const, content: '', timestamp: new Date() }], updatedAt: new Date() }
          : c)
      );

      const updateLast = (text: string) => {
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId
            ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, content: text } : m), updatedAt: new Date() }
            : c)
        );
      };

      try {
        const trimmed = content.trim();
        const isGreeting = /^(hi|hey|hello|yo|muraho|bite|bonjour|salut)\b[!.\s]*$/i.test(trimmed);

        if (isGreeting) {
          assistantContent = "Hey there! 👋 I'm **EgreedAI**, your friendly assistant from **Egreed Technology**. Ask me anything — coding tips, facts, news, or just chat!";
          updateLast(assistantContent);
        } else {
          const searchResult = await performWebSearch(content);
          if (searchResult) {
            assistantContent = searchResult;
          } else {
            assistantContent = "Hmm, I couldn't find a clean answer right now. Mind rephrasing your question? 🙂\n\n— *Egreed Technology*";
          }
          updateLast(assistantContent);
        }

        if (isAuthenticated && user && assistantContent) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantContent
          });
        }
      } catch (error) {
        console.error('Error generating response:', error);
        toast({
          title: "Error",
          description: (error as Error).message || "Something went wrong",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [activeConversationId, conversations, isAuthenticated, user, toast, modelId, useKnowledge]
  );

  const generateImage = useCallback(async (prompt: string) => {
    let conversationId = activeConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: `Image: ${prompt.substring(0, 30)}...`,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (isAuthenticated && user) {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: newConversation.title
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating conversation:', error);
        } else if (data) {
          newConversation.id = data.id;
        }
      }

      setConversations((prev) => [newConversation, ...prev]);
      conversationId = newConversation.id;
      setActiveConversationId(conversationId);
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: `🎨 Generate image: ${prompt}`,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: [...c.messages, userMessage],
            updatedAt: new Date(),
          };
        }
        return c;
      })
    );

    setIsLoading(true);

    try {
      // Image generation is disabled since Lovable AI was disconnected
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Image generation is currently disabled. Connect your Llama Stack server to enable media generation.',
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

      // Save messages to database
      if (isAuthenticated && user) {
        await supabase.from('messages').insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: userMessage.content
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: aiMessage.content
          }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Image generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, isAuthenticated, user, toast]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload files",
        variant: "destructive"
      });
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${generateId()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-uploads')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-uploads')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive"
      });
      return null;
    }
  }, [isAuthenticated, user, toast]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  return {
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
    performWebSearch,
    modelId,
    selectModel,
    useKnowledge,
    toggleKnowledge,
  };
}
