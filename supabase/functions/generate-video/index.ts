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

    // Build the request body for video generation
    const requestBody: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: startingFrame 
            ? [
                { type: "text", text: `Create a ${duration}-second video animation based on this image. ${prompt}` },
                { type: "image_url", image_url: { url: startingFrame } }
              ]
            : `Generate a ${duration}-second ${aspectRatio} video: ${prompt}. Make it visually engaging and high quality.`
        }
      ],
      modalities: ["video", "text"]
    };

    // Note: Video generation through Lovable AI may have specific requirements
    // For now, we'll use image generation as a placeholder and return it as a "video frame"
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Create a cinematic ${aspectRatio} image that could be a key frame from a video: ${prompt}. Ultra high resolution, professional quality.`
          }
        ],
        modalities: ["image", "text"]
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
      
      throw new Error("Video generation failed");
    }

    const data = await response.json();
    
    // Extract generated image (as video frame preview)
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "Video frame generated successfully!";

    if (!imageUrl) {
      throw new Error("No video frame was generated");
    }

    console.log("Video frame generated successfully");

    return new Response(JSON.stringify({ 
      success: true,
      videoUrl: imageUrl, // For now, returning image as video frame
      text: textResponse,
      type: "image-preview", // Indicate this is a preview/frame
      duration,
      aspectRatio
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
