import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Loopy Auto-Edit, an AI video editor assistant. You generate professional edit timelines from raw clip descriptions and style preferences.

Given a set of video clips (with durations and descriptions) and a style preset, you MUST return a structured edit timeline using the tool provided.

RULES:
- Cut clips to their most interesting moments (keep cuts between 1-4 seconds each)
- Total output should be 15-60 seconds depending on content
- Match cuts to music BPM if provided (e.g. 120 BPM = cut every 0.5s for fast sections)
- Add transitions between clips (cut, fade, zoom, whip, glitch)
- Suggest color grade based on style
- Add 1-3 text overlays at key moments
- Balance energy: start strong, build, peak, resolve
- For "tiktok_viral": fast cuts, zoom transitions, bold text, high energy
- For "cinematic": slower cuts, fade transitions, subtle text, moody grades
- For "music_video": beat-synced cuts, glitch/whip transitions, stylized text
- For "vlog": natural cuts, simple fades, clean text, warm tones
- For "montage": rapid cuts, impact transitions, minimal text, high contrast`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clips, style, musicBpm, musicName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const clipDescriptions = clips.map((c: any, i: number) =>
      `Clip ${i + 1}: "${c.name}" — ${c.duration.toFixed(1)}s, ${c.resolution || 'unknown resolution'}, ${c.description || 'no description'}`
    ).join("\n");

    const userPrompt = `Generate an edit timeline for these clips:

${clipDescriptions}

Style: ${style || 'cinematic'}
${musicBpm ? `Music BPM: ${musicBpm}` : ''}
${musicName ? `Music: ${musicName}` : ''}

Create a professional edit with cuts, transitions, color grading, and text overlays.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_edit_timeline",
              description: "Generate a complete edit timeline with cuts, transitions, effects, and text overlays",
              parameters: {
                type: "object",
                properties: {
                  timeline: {
                    type: "object",
                    properties: {
                      total_duration: { type: "number", description: "Total output duration in seconds" },
                      color_grade: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          temperature: { type: "number", description: "-100 to 100" },
                          contrast: { type: "number", description: "-100 to 100" },
                          saturation: { type: "number", description: "-100 to 100" },
                          brightness: { type: "number", description: "-100 to 100" },
                          filter: { type: "string", description: "Filter name: none, vintage, noir, neon, golden, cold, cinematic, bleach" }
                        },
                        required: ["name", "temperature", "contrast", "saturation", "brightness", "filter"]
                      },
                      cuts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            clip_index: { type: "number", description: "0-based clip index" },
                            start_time: { type: "number", description: "Start time within the clip in seconds" },
                            end_time: { type: "number", description: "End time within the clip in seconds" },
                            timeline_position: { type: "number", description: "Position on output timeline in seconds" },
                            transition_in: { type: "string", enum: ["cut", "fade", "zoom", "whip", "glitch", "dissolve"] },
                            speed: { type: "number", description: "Playback speed multiplier (1.0 = normal)" },
                            notes: { type: "string", description: "Why this cut was chosen" }
                          },
                          required: ["clip_index", "start_time", "end_time", "timeline_position", "transition_in", "speed"]
                        }
                      },
                      text_overlays: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            text: { type: "string" },
                            start_time: { type: "number" },
                            duration: { type: "number" },
                            style: { type: "string", enum: ["bold_impact", "subtle_lower", "glitch_title", "handwritten", "minimal"] },
                            position: { type: "string", enum: ["center", "bottom", "top", "left", "right"] }
                          },
                          required: ["text", "start_time", "duration", "style", "position"]
                        }
                      },
                      music_sync_notes: { type: "string", description: "How the edit syncs to the music" },
                      creative_direction: { type: "string", description: "Brief explanation of the edit approach" }
                    },
                    required: ["total_duration", "color_grade", "cuts", "text_overlays", "creative_direction"]
                  }
                },
                required: ["timeline"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_edit_timeline" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return a valid timeline" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeline = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(timeline), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-edit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
