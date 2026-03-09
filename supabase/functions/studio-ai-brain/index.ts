import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, editData, styleHistory, clipInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiCall = async (systemPrompt: string, userPrompt: string, tools: any[], toolChoice: any) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools,
          tool_choice: toolChoice,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return { error: "Rate limited, try again shortly", status: 429 };
        if (response.status === 402) return { error: "AI credits depleted", status: 402 };
        const t = await response.text();
        console.error("AI error:", response.status, t);
        return { error: "AI generation failed", status: 500 };
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return { error: "No AI response", status: 500 };
      return { data: JSON.parse(toolCall.function.arguments), status: 200 };
    };

    // ═══ INSTANT EDIT RATING (Pre-Submit QOI Check) ═══
    if (type === "rate-edit") {
      const result = await aiCall(
        `You are an ELITE video editing judge at Loopgate — the world's premier competitive editing platform. You rate edits using the QOI (Quality, Originality, Impact) system. You are harsh but fair, like a Michelin inspector for video edits.

SCORING RULES:
- Quality (0-100): Technical execution. Color grading consistency, clean cuts, smooth transitions, audio mix, resolution, sharpness.
- Originality (0-100): Creative uniqueness. Novel effects combos, unexpected transitions, unique pacing, distinctive style.
- Impact (0-100): Emotional/viewer impact. Hook strength, pacing, momentum, replay value, virality potential.
- Overall QOI = weighted average (Quality 35%, Originality 35%, Impact 30%)

TIER SYSTEM:
- 90-100: ELITE (S-tier, top 1%)
- 75-89: PRO (A-tier, strong)
- 60-74: RISING (B-tier, good foundations)
- 40-59: DEVELOPING (C-tier, needs work)
- 0-39: ROOKIE (needs fundamentals)

Be specific about what works and what doesn't. Reference actual editing techniques. Give actionable improvement tips.`,
        `Rate this edit based on these parameters:

EDIT DETAILS:
- Duration: ${editData?.duration || 0}s (trimmed from ${editData?.originalDuration || 0}s)
- Filter: ${editData?.filter || 'none'}
- Effects active: ${(editData?.effects || []).join(', ') || 'none'}
- Speed: ${editData?.speed || 1}x
- Text overlays: ${editData?.textCount || 0}
- Transition: ${editData?.transition || 'none'}
- Color adjustments: ${editData?.hasAdjustments ? 'Custom grading applied' : 'Default'}
- Crop preset: ${editData?.cropPreset || 'original'}
- Keyframes: ${editData?.keyframeCount || 0}
- Masks: ${editData?.maskCount || 0}
- Blend mode: ${editData?.blendMode || 'normal'}
- Stickers/overlays: ${editData?.stickerCount || 0}
- Audio track: ${editData?.hasAudio ? 'Custom audio' : 'Original audio'}
- Motion templates: ${editData?.motionTemplates || 0}
- Chroma key: ${editData?.chromaEnabled ? 'Active' : 'Off'}
- Stabilization: ${editData?.stabilized ? 'On' : 'Off'}

${editData?.description ? `Editor's description: ${editData.description}` : ''}

Judge this edit honestly and give a pre-submission QOI diagnostic.`,
        [{
          type: "function",
          function: {
            name: "rate_edit",
            description: "Return a complete QOI diagnostic rating for the edit",
            parameters: {
              type: "object",
              properties: {
                quality_score: { type: "number", description: "0-100 quality/technical score" },
                originality_score: { type: "number", description: "0-100 originality score" },
                impact_score: { type: "number", description: "0-100 impact score" },
                overall_qoi: { type: "number", description: "Weighted average QOI score" },
                tier: { type: "string", enum: ["ELITE", "PRO", "RISING", "DEVELOPING", "ROOKIE"] },
                verdict: { type: "string", description: "One-line verdict (e.g. 'Clean execution but lacks originality')" },
                strengths: { type: "array", items: { type: "string" }, description: "2-4 specific strengths" },
                weaknesses: { type: "array", items: { type: "string" }, description: "2-4 specific areas to improve" },
                tips: { type: "array", items: { type: "string" }, description: "3-5 actionable tips to boost the score" },
                arena_ready: { type: "boolean", description: "Whether this edit is ready for arena submission" },
                predicted_percentile: { type: "number", description: "Predicted percentile vs other editors (0-100)" },
                style_tags: { type: "array", items: { type: "string" }, description: "2-4 style tags (e.g. 'cinematic', 'phonk', 'minimal')" }
              },
              required: ["quality_score", "originality_score", "impact_score", "overall_qoi", "tier", "verdict", "strengths", "weaknesses", "tips", "arena_ready", "predicted_percentile", "style_tags"],
              additionalProperties: false
            }
          }
        }],
        { type: "function", function: { name: "rate_edit" } }
      );

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ AI STYLE LEARNING ═══
    if (type === "learn-style") {
      const result = await aiCall(
        `You are an AI style analyst for video editors. Given a history of editing choices, identify the editor's unique style DNA and suggest personalized presets they'd love.

Analyze patterns in:
- Filter preferences (warm vs cold, saturated vs muted)
- Effect usage (subtle vs heavy, which combos)
- Pacing (fast cuts vs slow, speed ramps)
- Color grading tendencies
- Text/overlay usage patterns
- Audio mixing style`,
        `Analyze this editor's style history and generate personalized recommendations:

EDITING HISTORY:
${JSON.stringify(styleHistory || {
  filters_used: [],
  effects_used: [],
  avg_speed: 1,
  avg_duration: 15,
  text_usage: "moderate",
  color_temperature: "neutral",
  sessions: 0
}, null, 2)}

Generate their style DNA profile and suggest custom presets.`,
        [{
          type: "function",
          function: {
            name: "analyze_style",
            description: "Return style DNA analysis and personalized preset suggestions",
            parameters: {
              type: "object",
              properties: {
                style_dna: {
                  type: "object",
                  properties: {
                    archetype: { type: "string", description: "Editor archetype (e.g. 'Cinematic Storyteller', 'Chaos Phonk King', 'Clean Minimalist')" },
                    signature_moves: { type: "array", items: { type: "string" }, description: "3-5 signature editing patterns" },
                    color_profile: { type: "string", description: "Their color grading tendency" },
                    pacing_style: { type: "string", enum: ["methodical", "balanced", "aggressive", "chaotic"] },
                    energy_level: { type: "number", description: "1-10 average energy" },
                    uniqueness_score: { type: "number", description: "0-100 how unique their style is" }
                  },
                  required: ["archetype", "signature_moves", "color_profile", "pacing_style", "energy_level", "uniqueness_score"],
                  additionalProperties: false
                },
                recommended_presets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      filter: { type: "string" },
                      effects: { type: "array", items: { type: "string" } },
                      speed: { type: "number" },
                      color_temp: { type: "string", enum: ["warm", "cool", "neutral", "extreme_warm", "extreme_cool"] }
                    },
                    required: ["name", "description", "filter", "effects", "speed"],
                    additionalProperties: false
                  }
                },
                growth_areas: { type: "array", items: { type: "string" }, description: "Areas to experiment with" },
                similar_creators: { type: "array", items: { type: "string" }, description: "Famous editors with similar style" }
              },
              required: ["style_dna", "recommended_presets", "growth_areas", "similar_creators"],
              additionalProperties: false
            }
          }
        }],
        { type: "function", function: { name: "analyze_style" } }
      );

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ AI SCENE DETECTION ═══
    if (type === "detect-scenes") {
      const result = await aiCall(
        `You are an AI scene detection engine for video editing. Based on clip metadata, predict optimal scene boundaries, action peaks, and key moments. Think like a professional editor identifying the best cuts.

Consider:
- Typical scene change patterns in short-form content
- Music beat alignment if BPM provided
- Action/energy peaks based on content description
- Rule of thirds timing for hooks and climaxes`,
        `Detect scenes and key moments in this clip:

CLIP INFO:
- Duration: ${clipInfo?.duration || 10}s
- Content type: ${clipInfo?.contentType || 'unknown'}
- Description: ${clipInfo?.description || 'Short form video clip'}
- BPM: ${clipInfo?.bpm || 'unknown'}
- Has audio: ${clipInfo?.hasAudio ? 'yes' : 'no'}

Suggest scene boundaries, key moments, and optimal cut points.`,
        [{
          type: "function",
          function: {
            name: "detect_scenes",
            description: "Return detected scenes, key moments, and suggested cut points",
            parameters: {
              type: "object",
              properties: {
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      start: { type: "number" },
                      end: { type: "number" },
                      type: { type: "string", enum: ["intro", "buildup", "peak", "bridge", "outro", "transition"] },
                      energy: { type: "number", description: "1-10 energy level" },
                      description: { type: "string" }
                    },
                    required: ["start", "end", "type", "energy", "description"],
                    additionalProperties: false
                  }
                },
                key_moments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "number" },
                      type: { type: "string", enum: ["hook", "beat_drop", "climax", "reaction", "reveal", "transition_point"] },
                      importance: { type: "number", description: "1-10" },
                      suggested_effect: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["time", "type", "importance", "description"],
                    additionalProperties: false
                  }
                },
                optimal_trim: {
                  type: "object",
                  properties: {
                    start: { type: "number" },
                    end: { type: "number" },
                    reason: { type: "string" }
                  },
                  required: ["start", "end", "reason"],
                  additionalProperties: false
                },
                energy_map: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "number" },
                      energy: { type: "number", description: "0-100" }
                    },
                    required: ["time", "energy"],
                    additionalProperties: false
                  },
                  description: "Energy curve sampled every 0.5-1s"
                },
                pacing_recommendation: { type: "string", enum: ["keep_original", "speed_up", "slow_down", "dynamic_speed"] }
              },
              required: ["scenes", "key_moments", "optimal_trim", "energy_map", "pacing_recommendation"],
              additionalProperties: false
            }
          }
        }],
        { type: "function", function: { name: "detect_scenes" } }
      );

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("studio-ai-brain error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
