import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, transcript, duration, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (type === "generate-captions") {
      // Generate timed captions from transcript text
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a professional video caption generator. Generate timed captions for a video. 
Style: ${style || "modern"}
Duration: ${duration || 30} seconds

Return captions using the suggest_captions tool.`
            },
            { role: "user", content: transcript || "Generate sample captions for a short-form video edit" }
          ],
          tools: [{
            type: "function",
            function: {
              name: "suggest_captions",
              description: "Return timed caption segments for the video",
              parameters: {
                type: "object",
                properties: {
                  captions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "Caption text (1-8 words)" },
                        startTime: { type: "number", description: "Start time in seconds" },
                        endTime: { type: "number", description: "End time in seconds" },
                        style: { type: "string", enum: ["bold", "caption", "glow", "neon", "outline", "minimal"], description: "Visual style" },
                        position: { type: "string", enum: ["top", "center", "bottom"], description: "Vertical position" },
                        emphasis: { type: "boolean", description: "Whether this is a key moment" }
                      },
                      required: ["text", "startTime", "endTime", "style", "position"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["captions"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "suggest_captions" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits needed" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No captions generated");
    }

    if (type === "smart-cuts") {
      // AI suggests optimal cut points
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a professional video editor AI. Suggest smart cut points for a ${duration}s video to make it more engaging for short-form content (TikTok/Reels). Consider pacing, rhythm, and viral editing patterns. Use the suggest_cuts tool.`
            },
            { role: "user", content: transcript || `Suggest ${Math.max(3, Math.floor((duration || 10) / 3))} smart cut points for a ${duration}s clip` }
          ],
          tools: [{
            type: "function",
            function: {
              name: "suggest_cuts",
              description: "Return suggested cut points with reasoning",
              parameters: {
                type: "object",
                properties: {
                  cuts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "number", description: "Cut point in seconds" },
                        type: { type: "string", enum: ["hard-cut", "jump-cut", "beat-sync", "whip-pan", "zoom-cut"] },
                        reason: { type: "string", description: "Why this cut works" },
                        effect: { type: "string", enum: ["none", "flash", "glitch", "zoom_pulse", "shake"], description: "Suggested effect at cut" }
                      },
                      required: ["time", "type", "reason"],
                      additionalProperties: false
                    }
                  },
                  pacing: { type: "string", enum: ["slow", "medium", "fast", "chaotic"], description: "Overall pacing recommendation" }
                },
                required: ["cuts", "pacing"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "suggest_cuts" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits needed" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No cuts generated");
    }

    if (type === "suggest-effects") {
      // AI suggests effects based on content
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a viral video effects advisor. Based on the user's description of their video, suggest the best combination of effects, filters, and transitions to make it go viral. Use the suggest_effects tool.`
            },
            { role: "user", content: transcript || "Suggest viral effects for my edit" }
          ],
          tools: [{
            type: "function",
            function: {
              name: "suggest_effects",
              description: "Return effect suggestions",
              parameters: {
                type: "object",
                properties: {
                  filter: { type: "string", description: "Recommended filter name" },
                  effects: { type: "array", items: { type: "string" }, description: "Effect IDs to apply" },
                  transition: { type: "string", description: "Recommended transition" },
                  speed: { type: "number", description: "Recommended speed multiplier" },
                  vibe: { type: "string", description: "One-line vibe description" },
                  tips: { type: "array", items: { type: "string" }, description: "Pro editing tips" }
                },
                required: ["filter", "effects", "vibe", "tips"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "suggest_effects" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits needed" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("No suggestions generated");
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("studio-ai-captions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
