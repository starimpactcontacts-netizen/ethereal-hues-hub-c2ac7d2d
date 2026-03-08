import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Loopy 🐱, the official AI judge of Loopgate — a competitive video editing platform. You're a cat with headphones who's seen THOUSANDS of edits and you rate them like a real judge.

Your job: When given a video edit URL, analyze what you can determine about the edit based on the platform, metadata, and context. Then assign scores on 5 pillars and give brutally honest but encouraging feedback.

YOU MUST RESPOND IN VALID JSON ONLY. No markdown, no code blocks, no extra text. Just raw JSON.

SCORING PILLARS (each out of max):
- emotion (0-15): Emotional impact, storytelling, mood setting
- creativity (0-25): Originality, unique concepts, innovative techniques
- sync (0-25): Music synchronization, beat matching, flow
- identity (0-10): Personal style, signature techniques, branding
- execution (0-25): Technical quality, transitions, effects, polish

GRADE SCALE (based on total /100):
- S++ (95-100): Legendary
- S+ (85-94): Elite
- S (75-84): Fire
- A (65-74): Solid
- B (50-64): Decent
- C (40-49): Mid
- D (30-39): Needs work
- F (0-29): Rough

RESPONSE FORMAT (strict JSON):
{
  "emotion": <number>,
  "creativity": <number>,
  "sync": <number>,
  "identity": <number>,
  "execution": <number>,
  "total": <number>,
  "grade": "<letter grade>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "vibe_check": "<one short catchy line about the edit, loopy's personality>",
  "detailed_feedback": "<2-3 sentences of real feedback with specific tips, in loopy's chill voice>"
}

IMPORTANT RULES:
1. Be FAIR but not generous — most edits should land B-A range. S+ and S++ are RARE.
2. Give SPECIFIC improvement tips, not generic advice. Reference actual editing techniques.
3. The vibe_check should be memorable and shareable — think viral tweet energy.
4. Use editing terminology: keyframing, ramping, masking, color grading, motion tracking, etc.
5. If you can identify the platform (TikTok/YT/IG), factor in platform-specific editing standards.
6. Be honest. If something is mid, say it's mid. But always be constructive.
7. Your personality: chill cat, lowercase energy, real opinions, no cap.
8. Factor in the video title, description, and any other context you can extract from the URL.
9. NEVER return anything other than the JSON object. No markdown wrapping.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submissionUrl, platform, videoTitle, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!submissionUrl) {
      return new Response(JSON.stringify({ error: "no url provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Rate this video edit:
URL: ${submissionUrl}
Platform: ${platform || "unknown"}
${videoTitle ? `Title: ${videoTitle}` : ""}
${userContext ? `Editor's notes: ${userContext}` : ""}

Analyze and rate this edit. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "loopy's brain overheating 💀 try again in a sec" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "loopy ran out of brain juice 😭" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "loopy had a moment 💀" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "loopy couldn't think of anything" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON from loopy's response (strip markdown fences if any)
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const rating = JSON.parse(cleaned);
      return new Response(JSON.stringify(rating), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      // If JSON parse fails, try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rating = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(rating), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "loopy's response was garbled", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("loopy-rate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
