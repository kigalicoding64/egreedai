import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { shouldTriggerWebSearch, formatSearchResults } from '@/utils/webSearchDetection';
import { BASE_SYSTEM, KINYARWANDA_CORPUS, isKinyarwandaQuery } from '@/utils/kinyarwandaCorpus';
import { retrieveKnowledge } from '@/utils/kbRetrieval';

// Map our branded EgreedAI variants -> system personas
const MODEL_PERSONA_MAP: Record<string, string> = {
  'egreed-fast':   'Be quick, friendly, concise.',
  'egreed-pro':    'Be deeply thoughtful, thorough, accurate. Use markdown structure.',
  'egreed-reason': 'Think step by step. Show clear reasoning then a definitive answer.',
  'egreed-coder':  'You are an expert software engineer. Always produce production-quality code with file paths.',
  'egreed-nano':   'Ultra-fast assistant. Answer in 1-3 sentences unless asked for detail.',
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateTitle = (content: string) => {
  return content.length > 40 ? content.substring(0, 40) + '...' : content;
};

const WEB_SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/web-search`;
const LLAMA_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llama-chat`;

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

      // Check if we should trigger a web search
      const searchDecision = shouldTriggerWebSearch(content);
      let webSearchContext = '';

      if (searchDecision.shouldSearch) {
        const searchResult = await performWebSearch(content);
        if (searchResult) {
          webSearchContext = `\n\n[Web Search Results]:\n${searchResult}\n\nPlease use the above search results to provide an accurate and up-to-date response.`;
        }
      }

      // Add web search context to messages if available
      const messagesWithContext = webSearchContext
        ? [...messagesForApi.slice(0, -1), { role: 'user' as const, content: content + webSearchContext }]
        : messagesForApi;

      // Generate AI response via Puter.js streaming (no Lovable AI credits)
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
        // Pull knowledge base context client-side (our training data)
        let kbContext = '';
        if (useKnowledge && isAuthenticated && user) {
          try {
            kbContext = await retrieveKnowledge(content, user.id, 4);
          } catch (e) { console.warn('KB lookup failed', e); }
        }

        const rwContext = isKinyarwandaQuery(content) ? `\n\n${KINYARWANDA_CORPUS}` : '';
        const persona = MODEL_PERSONA_MAP[modelId] || MODEL_PERSONA_MAP['egreed-fast'];
        const systemContent = `${BASE_SYSTEM}\n\n${persona}${kbContext}${rwContext}`;

        const llamaMessages = [
          { role: 'system', content: systemContent },
          ...messagesWithContext.map((m) => ({ role: m.role, content: m.content })),
        ];

        let fallbackToSearch = false;
        try {
          const response = await fetch(LLAMA_CHAT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ messages: llamaMessages, stream: true }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (errData.notConfigured) {
              fallbackToSearch = true;
              throw new Error('Llama Stack not configured');
            }
            throw new Error(errData.error || `LLM error ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);
              if (line.endsWith('\r')) line = line.slice(0, -1);
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (delta) {
                  assistantContent += delta;
                  updateLast(assistantContent);
                }
              } catch {
                buffer = line + '\n' + buffer;
                break;
              }
            }
          }

          // Flush remaining buffer
          if (buffer.trim()) {
            for (let raw of buffer.split('\n')) {
              if (!raw) continue;
              if (raw.endsWith('\r')) raw = raw.slice(0, -1);
              if (!raw.startsWith('data: ')) continue;
              const jsonStr = raw.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
                if (delta) {
                  assistantContent += delta;
                  updateLast(assistantContent);
                }
              } catch {}
            }
          }
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            console.log('Request aborted');
          } else if (fallbackToSearch) {
            // Fallback to web search results
            const searchResult = await performWebSearch(content);
            if (searchResult) {
              assistantContent = searchResult;
              updateLast(assistantContent);
            } else {
              assistantContent = 'No LLM is currently configured and no search results were found. Please add your Llama Stack URL in project secrets to enable AI responses.';
              updateLast(assistantContent);
            }
          } else {
            console.error('Error generating response:', error);
            toast({
              title: "Error",
              description: (error as Error).message || "Failed to get AI response",
              variant: "destructive"
            });
          }
        }

        if (isAuthenticated && user && assistantContent) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantContent
          });
        }
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
