import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Loopgate Bureau's internal edit analysis engine — a professional-grade video editing judge used exclusively by admin judges. You analyze video edits frame-by-frame with extreme precision and deliver comprehensive diagnostic reports.

You will receive multiple extracted frames from a video edit at different timestamps. Analyze EACH frame and the edit as a whole.

FRAME-BY-FRAME ANALYSIS:
For each frame, evaluate:
- Color grading quality & consistency
- Composition & framing
- Visual effects (masking, rotoscoping, compositing, overlays)
- Text/typography quality if present
- Motion blur / speed ramp indicators
- Keyframe sophistication
- Grain/texture/film treatment
- Overall visual polish of that moment

OVERALL EDIT ANALYSIS:
- Flow & pacing (inferred from frame progression)
- Visual consistency across frames
- Color grading coherence
- Transition quality (visible between frames)
- Technical execution level
- Creative vision & concept
- Storytelling / narrative arc
- Audio-visual sync indicators

SCORING PILLARS:
- emotion (0-15): Emotional impact, storytelling, mood
- creativity (0-25): Originality, unique concepts, innovation
- sync (0-25): Music sync indicators, rhythm, flow, pacing
- identity (0-10): Personal style, signature techniques
- execution (0-25): Technical quality, transitions, effects, polish

GRADE SCALE (total /100):
- S++ (95-100): Legendary — museum-tier craftsmanship
- S+ (85-94): Elite — professional studio quality
- S (75-84): Fire — genuinely impressive work
- A (65-74): Solid — strong fundamentals
- B (50-64): Decent — shows clear promise
- C (40-49): Mid — needs significant improvement
- D (30-39): Below average — fundamental issues
- F (0-29): Rough — major rework needed

YOU MUST RESPOND IN VALID JSON ONLY:
{
  "emotion": <number>,
  "creativity": <number>,
  "sync": <number>,
  "identity": <number>,
  "execution": <number>,
  "total": <number>,
  "grade": "<S++|S+|S|A|B|C|D|F>",
  "frame_analysis": [
    {
      "frame_index": <number>,
      "timestamp_label": "<e.g. 0:02>",
      "observations": "<what you see in this specific frame — color, composition, effects, quality>",
      "score_impact": "<how this frame affects the overall rating — positive/negative/neutral>"
    }
  ],
  "strengths": ["<specific strength>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<specific issue>", "<issue 2>", "<issue 3>"],
  "technical_verdict": "<2-3 sentences on technical execution — editing software mastery, effect quality, render quality>",
  "creative_verdict": "<2-3 sentences on creative vision — concept, originality, artistic direction>",
  "sync_verdict": "<2-3 sentences on rhythm/flow — pacing, beat matching indicators, transition timing>",
  "recommended_grade": "<S++|S+|S|A|B|C|D|F>",
  "grade_justification": "<3-4 sentences explaining why this grade and not higher/lower>",
  "improvement_notes": "<2-3 specific actionable improvements for the editor>",
  "judge_summary": "<one powerful sentence summary for the judge's notes — professional tone>"
}

CRITICAL RULES:
1. Be BRUTALLY HONEST — this is an internal judge tool, not public-facing. No sugarcoating.
2. REFERENCE SPECIFIC FRAMES. Say "Frame 3 shows excellent masking work" not "the masking is good."
3. S+ and S++ are EXCEPTIONALLY rare. Most edits are B-A range.
4. Use professional editing terminology: keyframing, ramping, rotoscoping, compositing, color science, LUTs, motion tracking, parallax, chromatic aberration, etc.
5. Compare against professional standards — this tool helps judges calibrate their scores.
6. NEVER return anything other than the JSON object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { frames, editorNotes, videoTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: "No frames provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build multimodal content with all frames
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Add each frame as an image
    for (let i = 0; i < frames.length; i++) {
      content.push({
        type: "image_url",
        image_url: { url: frames[i].dataUrl },
      });
      content.push({
        type: "text",
        text: `[Frame ${i + 1} — Timestamp: ${frames[i].timestamp}]`,
      });
    }

    // Add context prompt
    const contextParts = [
      `\nAnalyze this video edit using the ${frames.length} frames extracted above.`,
      `Total frames extracted: ${frames.length}`,
    ];
    if (videoTitle) contextParts.push(`Video title: ${videoTitle}`);
    if (editorNotes) contextParts.push(`Judge notes: ${editorNotes}`);
    contextParts.push(`\nProvide your complete frame-by-frame analysis and rating. Return ONLY valid JSON.`);

    content.push({ type: "text", text: contextParts.join("\n") });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ];

    console.log(`Analyzing edit with ${frames.length} frames...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return new Response(JSON.stringify({ error: "No analysis returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const analysis = JSON.parse(cleaned);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const analysis = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          console.error("Failed to parse analysis JSON:", cleaned.slice(0, 500));
          return new Response(JSON.stringify({ error: "Failed to parse analysis", raw: cleaned.slice(0, 1000) }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      return new Response(JSON.stringify({ error: "Invalid analysis response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("analyze-edit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
