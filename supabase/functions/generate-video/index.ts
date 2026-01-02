import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, duration = 5, aspectRatio = "16:9", videoType = "text-to-video", startingFrame } = await req.json();
    
    if (!prompt) {
      throw new Error("No prompt provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Video generation request:", { prompt, duration, aspectRatio, videoType });

    // For video generation, we'll use Google's Gemini model which supports video generation
    // First, create a detailed video description using AI
    const scriptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional video director and scriptwriter. Create a detailed visual description for a ${duration}-second ${aspectRatio} video based on the user's prompt. Include:
1. Scene-by-scene breakdown with timing
2. Visual elements and camera movements
3. Color palette and mood
4. Key frames description
Keep it concise but visually descriptive.`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!scriptResponse.ok) {
      const errorText = await scriptResponse.text();
      console.error("Script generation error:", scriptResponse.status, errorText);
      throw new Error("Failed to generate video script");
    }

    const scriptData = await scriptResponse.json();
    const videoScript = scriptData.choices?.[0]?.message?.content || prompt;

    console.log("Generated video script:", videoScript.substring(0, 200));

    // Now generate a high-quality key frame image using Gemini's image generation
    const imagePrompt = startingFrame 
      ? `Based on this image, create a cinematic ${aspectRatio} video key frame: ${prompt}. Ultra high resolution, professional quality, ready for animation.`
      : `Create a stunning cinematic ${aspectRatio} key frame image for a ${duration}-second video: ${prompt}. Ultra high resolution, professional quality, dramatic lighting, suitable for video/ads.`;

    const imageRequest: { model: string; messages: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[]; modalities: string[] } = {
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: startingFrame ? [
            { type: "text", text: imagePrompt },
            { type: "image_url", image_url: { url: startingFrame } }
          ] : imagePrompt
        }
      ],
      modalities: ["image", "text"]
    };

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(imageRequest),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("AI gateway error:", imageResponse.status, errorText);
      
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Video frame generation failed");
    }

    const imageData = await imageResponse.json();
    
    // Extract generated image
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = imageData.choices?.[0]?.message?.content || "Video preview generated successfully!";

    if (!imageUrl) {
      throw new Error("No video frame was generated");
    }

    console.log("Video frame generated successfully");

    // Return the video preview with metadata
    // Note: Full video generation requires specialized video AI APIs
    // Currently returning high-quality key frame as video preview
    return new Response(JSON.stringify({ 
      success: true,
      videoUrl: imageUrl,
      text: `🎬 **Video Preview Generated**\n\n${textResponse}\n\n**Video Script:**\n${videoScript.substring(0, 500)}${videoScript.length > 500 ? '...' : ''}\n\n*Note: This is a high-quality key frame preview. Full video rendering with motion is coming soon!*`,
      type: "video-preview",
      script: videoScript,
      duration,
      aspectRatio,
      videoType,
      metadata: {
        format: "image/png",
        preview: true,
        frameCount: 1,
        estimatedDuration: duration
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Video generation function error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
