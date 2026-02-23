import { useState } from 'react';
import { Video, X, Upload, Wand2, Clock, Sparkles, Image, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoGeneratorProps {
  onClose: () => void;
  onVideoGenerated: (videoUrl: string, prompt: string) => void;
  uploadedFiles?: File[];
}

type VideoType = 'text-to-video' | 'image-to-video' | 'short-clip';
type Duration = 5 | 10;
type AspectRatio = '16:9' | '9:16' | '1:1';

export function VideoGenerator({ onClose, onVideoGenerated, uploadedFiles = [] }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('text-to-video');
  const [duration, setDuration] = useState<Duration>(5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a video description');
      return;
    }

    if (videoType === 'image-to-video' && !selectedImage && uploadedFiles.length === 0) {
      toast.error('Please upload an image for image-to-video generation');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            duration,
            aspectRatio,
            videoType,
            // If image-to-video, include the image
            startingFrame: imagePreview || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      
      if (data.videoUrl) {
        toast.success('Video generated successfully!');
        onVideoGenerated(data.videoUrl, prompt);
        onClose();
      } else {
        throw new Error('No video URL returned');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error((error as Error).message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Video Generator</h2>
              <p className="text-xs text-muted-foreground">Create AI-powered videos & ads</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Video Type Selection */}
          <div className="space-y-2">
            <Label>Video Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'text-to-video' as VideoType, icon: Wand2, label: 'Text to Video' },
                { type: 'image-to-video' as VideoType, icon: Image, label: 'Image to Video' },
                { type: 'short-clip' as VideoType, icon: FileVideo, label: 'Short Clip/Ad' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setVideoType(type)}
                  className={cn(
                    "p-3 rounded-lg border transition-all flex flex-col items-center gap-2",
                    videoType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload for image-to-video */}
          {videoType === 'image-to-video' && (
            <div className="space-y-2">
              <Label>Starting Image</Label>
              <div className="border-2 border-dashed border-border/50 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-8 h-8"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload an image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Video Description</Label>
            <Textarea
              placeholder={
                videoType === 'short-clip'
                  ? "Describe your advertisement or short clip..."
                  : "Describe what you want in the video..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </Label>
            <div className="flex gap-2">
              {[5, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d as Duration)}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-all",
                    duration === d
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:bg-secondary/50"
                  )}
                >
                  {d} seconds
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <div className="flex gap-2">
              {[
                { ratio: '16:9' as AspectRatio, label: 'Landscape' },
                { ratio: '9:16' as AspectRatio, label: 'Portrait' },
                { ratio: '1:1' as AspectRatio, label: 'Square' },
              ].map(({ ratio, label }) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={cn(
                    "px-4 py-2 rounded-lg border transition-all flex-1",
                    aspectRatio === ratio
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:bg-secondary/50"
                  )}
                >
                  <span className="font-medium">{ratio}</span>
                  <span className="text-xs block text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                Generating... (~10s)
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Video
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Powered by Lovable Cloud AI — generates in ~10 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
