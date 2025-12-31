import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, Square, Image, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onGenerateImage?: (prompt: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSendMessage, onGenerateImage, isLoading, onStop }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    setTranscript 
  } = useVoice();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Update message when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      if (showImagePrompt && onGenerateImage) {
        onGenerateImage(message.trim());
      } else {
        onSendMessage(message.trim());
      }
      setMessage('');
      setTranscript('');
      setShowImagePrompt(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Mode indicator */}
        {showImagePrompt && (
          <div className="mb-2 flex items-center gap-2 text-sm text-primary">
            <Image className="w-4 h-4" />
            <span>Image generation mode - describe what you want to create</span>
            <button 
              type="button"
              onClick={() => setShowImagePrompt(false)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className={cn(
          "glass rounded-2xl p-2 flex items-end gap-2 glow-sm",
          isListening && "ring-2 ring-primary ring-opacity-50"
        )}>
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-10 h-10 text-muted-foreground hover:text-foreground flex-shrink-0"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Image Generation Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 flex-shrink-0 transition-colors",
              showImagePrompt 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={isLoading}
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            title="Generate image"
          >
            <Image className="w-5 h-5" />
          </Button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showImagePrompt ? "Describe the image you want to generate..." : "Message EgreedAI..."}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-muted-foreground py-2.5 px-2 min-h-[44px] max-h-[200px] scrollbar-thin"
            rows={1}
            disabled={isLoading}
          />

          {/* Voice Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 flex-shrink-0 transition-all",
              isListening 
                ? "text-primary bg-primary/10 animate-pulse" 
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={isLoading}
            onClick={handleVoiceClick}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Send/Stop Button */}
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              className="w-10 h-10 bg-destructive hover:bg-destructive/90 flex-shrink-0"
              onClick={onStop}
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "w-10 h-10 flex-shrink-0 transition-all duration-300",
                message.trim()
                  ? "bg-primary hover:bg-primary/90 glow-sm"
                  : "bg-secondary text-muted-foreground"
              )}
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-3">
          EgreedAI can make mistakes. Consider checking important information.
        </p>
      </div>
    </form>
  );
}
