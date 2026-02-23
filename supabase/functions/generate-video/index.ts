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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Video generation request:", { prompt, duration, aspectRatio, videoType });

    // Single optimized call - generate a cinematic key frame directly
    const imagePrompt = startingFrame 
      ? `Transform this image into a cinematic ${aspectRatio} video frame: ${prompt}. Ultra high resolution, dramatic lighting, professional quality.`
      : `Create a stunning cinematic ${aspectRatio} frame for: ${prompt}. Ultra high resolution, dramatic lighting, professional video quality, 8K detail.`;

    const messages: any[] = [
      {
        role: "user",
        content: startingFrame ? [
          { type: "text", text: imagePrompt },
          { type: "image_url", image_url: { url: startingFrame } }
        ] : imagePrompt
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`Video frame generation failed (${response.status})`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      throw new Error("No video frame was generated");
    }

    console.log("Video frame generated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      videoUrl: imageUrl,
      text: textResponse || `🎬 Video preview for: "${prompt}"`,
      type: "video-preview",
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
    console.error("Video generation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
