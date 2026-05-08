// Lovable AI is intentionally DISABLED for this project.
// All chat is handled client-side by Puter.js (see src/hooks/useChat.ts).
// This stub remains so existing references resolve, but always returns 410 Gone.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error: "Lovable AI is disabled for EgreedAI. Chat runs client-side via Puter.js.",
      disabled: true,
    }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
