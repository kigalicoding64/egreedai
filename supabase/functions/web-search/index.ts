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
    const { query, language = 'en' } = await req.json();
    
    if (!query) {
      throw new Error("No search query provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Web search request for:", query, "language:", language);

    // Use Lovable AI to perform web search with grounding
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a web search assistant. Search the web for the most current and accurate information about the user's query. Provide:
1. A comprehensive answer based on current web information
2. Include sources and URLs when available
3. Respond in ${language} language when possible
4. Format the response with clear sections
5. Include relevant facts, statistics, and recent updates
6. If discussing current events, mention dates and sources`
          },
          {
            role: "user",
            content: `Search the web and provide current information about: ${query}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "web_search_results",
              description: "Return structured web search results",
              parameters: {
                type: "object",
                properties: {
                  answer: {
                    type: "string",
                    description: "Comprehensive answer to the query"
                  },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                        snippet: { type: "string" }
                      }
                    }
                  },
                  lastUpdated: {
                    type: "string",
                    description: "When this information was last updated"
                  }
                },
                required: ["answer"]
              }
            }
          }
        ]
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
      
      throw new Error("Web search failed");
    }

    const data = await response.json();
    
    // Extract the response content
    let answer = "";
    let sources: Array<{title: string, url: string, snippet: string}> = [];

    const choice = data.choices?.[0];
    if (choice?.message?.tool_calls?.[0]) {
      try {
        const toolResult = JSON.parse(choice.message.tool_calls[0].function.arguments);
        answer = toolResult.answer || "";
        sources = toolResult.sources || [];
      } catch {
        answer = choice.message?.content || "";
      }
    } else {
      answer = choice?.message?.content || "";
    }

    console.log("Web search completed successfully");

    return new Response(JSON.stringify({ 
      success: true,
      answer,
      sources,
      query
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Web search function error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
