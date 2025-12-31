import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, Square, Image, X, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  onGenerateImage?: (prompt: string) => void;
  onFileUpload?: (file: File) => Promise<string | null>;
  isLoading: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSendMessage, onGenerateImage, onFileUpload, isLoading, onStop }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || uploadedFile) && !isLoading) {
      if (showImagePrompt && onGenerateImage) {
        onGenerateImage(message.trim());
      } else if (uploadedFile && onFileUpload) {
        setIsUploading(true);
        const imageUrl = await onFileUpload(uploadedFile);
        setIsUploading(false);
        onSendMessage(message.trim() || 'Uploaded an image', imageUrl || undefined);
      } else {
        onSendMessage(message.trim());
      }
      setMessage('');
      setTranscript('');
      setShowImagePrompt(false);
      setUploadedFile(null);
      setUploadedPreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Unsupported file type. Please upload an image or PDF.');
        return;
      }

      setUploadedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedPreview(null);
      }
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        {/* Uploaded file preview */}
        {uploadedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50">
            {uploadedPreview ? (
              <img 
                src={uploadedPreview} 
                alt="Preview" 
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={clearUploadedFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "w-10 h-10 flex-shrink-0 transition-colors",
              uploadedFile 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={isLoading || isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload file"
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
          {isLoading || isUploading ? (
            <Button
              type="button"
              size="icon"
              className="w-10 h-10 bg-destructive hover:bg-destructive/90 flex-shrink-0"
              onClick={onStop}
              disabled={isUploading}
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className={cn(
                "w-10 h-10 flex-shrink-0 transition-all duration-300",
                (message.trim() || uploadedFile)
                  ? "bg-primary hover:bg-primary/90 glow-sm"
                  : "bg-secondary text-muted-foreground"
              )}
              disabled={!message.trim() && !uploadedFile}
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
