import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Loopgate Bureau's internal edit analysis engine. You analyze video edits with extreme precision using the QOI framework (Quality, Originality, Impact).

You will receive multiple extracted frames from a video edit at different timestamps. Analyze EACH frame and the edit as a whole.
If mission context is provided, judge how well the edit fits the mission brief.
If engagement stats (views, likes) are provided, factor them into the IMPACT score.

=== QOI SCORING FRAMEWORK ===

The three pillars:

1. QUALITY (0-40): Technical execution, color grading (CC), transitions, effects, render quality, resolution, motion blur, masking, compositing, audio mix. Covers: execution skill, software mastery, export quality, frame-by-frame polish.

2. ORIGINALITY (0-35): Creative vision, unique concept, scene selection, edit style innovation, storytelling, emotional depth, personal identity/signature. Covers: is this a cookie-cutter template or something fresh? Does the editor have their own style?

3. IMPACT (0-25): Viral potential, hook strength (first 1-2s), retention/pacing, shareability, audience response. If engagement stats (views, likes) are provided, use them as HARD DATA for this score:
   - Views/likes ratio matters (high likes relative to views = strong impact)
   - Raw view count indicates reach
   - If no stats provided, estimate based on hook, pacing, trending elements
   - High engagement stats can boost Impact, low stats should lower it

Total: /100

=== EDITOR TERMINOLOGY (use naturally) ===
CC, Null layers, Topaz, Twixtor, RSMB, Sapphire, Keyframes, Velocity, Shake, Displacement, Glitch, Chromatic aberration, Vignette, LUTs, Masking, Rotoscoping, Blend modes, Expressions, Motion tracking, 3D layers, Parallax, AMV, Velocity edit, Flow edit, Hard cuts, Beat sync, Impact frames, Flash transitions, Zoom cuts, Whip pans, Glow, Light leaks, Particles, RGB split, Grain

=== GRADE SCALE (total /100) ===
- S (85-100): Elite — professional quality, genuinely impressive work. ALMOST NEVER given. Maybe 1 in 50 edits.
- A (70-84): Solid — clean work, strong fundamentals, minor improvements needed. Rare — maybe 1 in 10.
- B (55-69): Above average — shows promise but needs more advanced techniques. This is the CEILING for most edits.
- C (40-54): Average — basic execution, nothing special. THIS IS WHERE MOST EDITS LAND. Default assumption.
- D (25-39): Below average — fundamental issues, lazy work, template-tier
- F (0-24): Rough — start over, barely tried

=== SCORING BIAS ===
Your DEFAULT starting assumption for any edit is C-range (40-54). The editor must PROVE they deserve higher through visible technical skill, creative originality, and measurable impact. Do NOT round up. Do NOT give benefit of the doubt. If you're torn between two grades, ALWAYS pick the lower one.

Common traps to avoid:
- Clean ≠ good. A clean but basic edit with simple cuts and no effects is C at best.
- Using a popular song doesn't make it original. Template-style velocity edits on trending audio = C or D.
- Aesthetic ≠ technical skill. Nice color grading alone doesn't carry an edit past B.
- Low engagement (under 1k views, under 50 likes) should actively LOWER the Impact score, not be ignored.

=== PAYOUT CONTEXT ===
If mission payout tiers are provided, your grade directly determines what the editor earns. Be BRUTALLY HONEST. Don't inflate grades. Most edits are C range. B is above average. A is uncommon. S is almost never given. We are not giving out free money — every dollar must be earned through visible skill.

=== RESPONSE FORMAT ===

RESPOND IN VALID JSON ONLY:
{
  "quality": <number 0-40>,
  "originality": <number 0-35>,
  "impact": <number 0-25>,
  "total": <number 0-100>,
  "grade": "<S|A|B|C|D|F>",
  "frame_analysis": [
    {
      "frame_index": <number>,
      "timestamp_label": "<e.g. 0:02>",
      "observations": "<what you see — use editor terminology>",
      "score_impact": "<positive/negative/neutral with reason>"
    }
  ],
  "quality_verdict": "<2-3 sentences on technical execution, CC, transitions, effects, render quality>",
  "originality_verdict": "<2-3 sentences on creative vision, concept, style, scene selection>",
  "impact_verdict": "<2-3 sentences on viral potential, hook, pacing, engagement data if provided>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "grade_justification": "<3-4 sentences explaining the grade honestly>",
  "improvement_notes": "<2-3 specific actionable improvements>",
  "long_feedback": "<5-8 sentences of detailed judge feedback covering all three QOI pillars, what worked, what didn't, specific techniques to improve. Written in authentic editor community voice — mix technical terms with natural language. Ready to copy-paste as official judge notes.>",
  "short_feedback": "<1-2 sentences. Straight to the point. What grade, why, and one thing to improve. Write like a real person texting — no forced slang, no corporate speak. Just honest and direct.>",
  "editor_note": "<EXACTLY 1-2 sentences formatted as: 'Grade [LETTER]. [reason + one improvement tip].' — this is the copy-paste line the judge sends to the editor. Keep it tight, professional, no fluff. Include the QOI total score.>",
  "recommended_grade": "<S|A|B|C|D|F>",
  "viral_potential": "<high/medium/low>"
}

=== CRITICAL RULES ===
1. Be BRUTALLY HONEST. This determines real payouts. No sugarcoating, no inflating. Real money is on the line.
2. S grade is EXCEPTIONALLY rare — reserved for genuinely elite, professional-tier work. A is also uncommon. Most edits land B-C range. Don't be generous.
3. Reference specific frames in your analysis.
4. The short_feedback MUST sound like a real human — not an AI. 1-2 sentences max. No emojis, no forced slang.
5. The long_feedback should be copy-paste ready for posting as judge notes.
6. If engagement stats are provided (views, likes), factor them heavily into Impact score. Low engagement = lower Impact, period.
7. NEVER return anything other than the JSON object.
8. The editor_note is what the judge literally copies and pastes to the editor — make it professional, concise, and include the score.
9. Actually STUDY the frames — look at transitions between them, CC consistency, masking quality, effects polish. Don't assume quality from aesthetics alone.
10. Default to skepticism. If something looks like a template or basic velocity edit, score it accordingly. Creativity means the editor brought something ORIGINAL.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { frames, editorNotes, videoTitle, selectedMission, selectedEditor, engagementStats } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: "No frames provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    for (let i = 0; i < frames.length; i++) {
      content.push({ type: "image_url", image_url: { url: frames[i].dataUrl } });
      content.push({ type: "text", text: `[Frame ${i + 1} — Timestamp: ${frames[i].timestamp}]` });
    }

    const contextParts = [
      `\nAnalyze this video edit using the ${frames.length} frames extracted above.`,
      `Total frames extracted: ${frames.length}`,
    ];

    if (videoTitle) contextParts.push(`Video title: ${videoTitle}`);
    if (editorNotes) contextParts.push(`Judge notes: ${editorNotes}`);
    if (selectedEditor?.username) contextParts.push(`Editor: @${selectedEditor.username}`);

    // Engagement stats for Impact scoring
    if (engagementStats) {
      if (engagementStats.views) contextParts.push(`Edit views: ${engagementStats.views}`);
      if (engagementStats.likes) contextParts.push(`Edit likes: ${engagementStats.likes}`);
      contextParts.push("Use these engagement stats as HARD DATA for the Impact pillar score.");
    }

    // Mission context with payout tiers
    if (selectedMission?.title) {
      contextParts.push(`Mission title: ${selectedMission.title}`);
      if (selectedMission.brandOrArtist) contextParts.push(`Mission client/artist: ${selectedMission.brandOrArtist}`);
      if (selectedMission.description) contextParts.push(`Mission brief: ${selectedMission.description}`);
      if (selectedMission.requirements) contextParts.push(`Mission requirements: ${selectedMission.requirements}`);
      if (selectedMission.payoutTiers) {
        contextParts.push(`Mission payout tiers: ${JSON.stringify(selectedMission.payoutTiers)}`);
        contextParts.push("Your grade DIRECTLY determines the editor's payout. Be strict and fair — this is real money.");
      }
      contextParts.push("Judge how well the edit fits this exact mission brief.");
    }

    contextParts.push(`\nProvide your complete QOI analysis. Return ONLY valid JSON.`);
    content.push({ type: "text", text: contextParts.join("\n") });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ];

    console.log(`Analyzing edit with ${frames.length} frames (QOI system)...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
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
