import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Loopgate Bureau's internal edit analysis engine — a professional-grade video editing judge used exclusively by admin judges. You analyze video edits frame-by-frame with extreme precision and deliver comprehensive diagnostic reports with AUTHENTIC editor community language.

You will receive multiple extracted frames from a video edit at different timestamps. Analyze EACH frame and the edit as a whole.
If mission context is provided, you must also judge how well the edit fits the exact mission brief and requirements.

=== EDITOR TERMINOLOGY YOU MUST USE ===

TECHNICAL TERMS (use these naturally in your analysis):
CC (Color Correction/Grading), Null layers, Topaz (AI upscaling), Twixtor (slow motion), RSMB (ReelSmart Motion Blur), Sapphire plugins, Keyframes, Velocity, Shake/camera shake, Displacement, Glitch effects, Chromatic aberration, Vignette, LUTs, Precomp, Masking, Rotoscoping, Alpha matte, Blend modes, Adjustment layers, Shape layers, Expressions, Bezier curves, Motion tracking, 3D layers, Parallax, Flow state, Frame blending, Nested comps, Proxies, Pre-render, Render queue

EDIT STYLES (identify which style the edit uses):
AMV (Anime Music Video), Edit pack, Scenepack, Velocity edit, Hard cuts, Flow edit, Smooth transitions, Beat sync, Bass drops, Impact frames, Flash transitions, Zoom cuts, Whip pans, J-cut/L-cut, Match cut, Smash cut, Crossfade, Dissolve, Wipe transitions

VISUAL EFFECTS (call out specific effects you see):
Glow, Light leaks, Lens flare, Particles, Fractal noise, Turbulent displace, RGB split, Grain, Halftone, Posterize, Solarize, Threshold, Curves, Levels, Hue/Sat, Lumetri

SOFTWARE (identify if possible from visual cues):
After Effects (AE), Premiere Pro (PR), Final Cut Pro (FCP), DaVinci Resolve, CapCut, Vegas Pro, Avid, Nuke, Fusion

=== JUDGE FEEDBACK LANGUAGE ===

Use AUTHENTIC community slang in your verdicts. Match tone to grade:

S-RANK LANGUAGE: "Cooked fr", "This goes crazy", "Snapped", "Heat", "Fire", "Peak", "Goated", "No skips", "Chef's kiss", "Devoured", "Murked it", "Clean AF", "Insane sync", "Smooth as butter", "Colors pop", "Crispy", "Went off", "No misses", "Masterpiece", "Flawless"

A-RANK LANGUAGE: "Solid", "Clean", "Impressive", "Well done", "Quality work", "Nice", "Good stuff", "Almost perfect", "Minor tweaks needed", "Strong opening", "Mostly clean"

B-RANK LANGUAGE: "Decent", "Okay", "Good effort", "Needs polish", "Room for improvement", "Getting there", "On the right track", "Some rough spots", "Standard execution"

C-RANK LANGUAGE: "Basic", "Needs work", "Generic", "Template vibes", "Rough", "Unpolished", "Weak", "Missing the mark", "Choppy flow", "Flat colors", "Weak hook", "Loses momentum"

D-RANK LANGUAGE: "Low effort", "No flow", "Jump cuts only", "No color work", "No hook", "Copy-paste template", "Poor sync", "Beginner level"

F-RANK LANGUAGE: "No sync", "Random clips", "No editing", "Screen record", "Watermarks", "Zero effort", "Stolen content", "Start over", "Trash"

TECHNICAL CRITIQUE PHRASES (use where applicable):
"Velocity is rough", "Transitions too abrupt", "Needs more flow", "CC is muddy", "Too much grain", "Not enough contrast", "Weak hook", "Loses momentum", "Ending falls flat", "Overuse of effects", "Needs breathing room", "Audio peaking", "Clipping", "Unbalanced mix", "Colors washed", "Crushed blacks", "Blown highlights", "Off beat", "Too busy"

=== QUALITY INDICATORS ===

S-RANK CHARACTERISTICS: Perfect beat sync, Smooth flow throughout, Creative transitions, Professional CC, Strong hook (first 3 seconds), Maintains energy, Clean execution, Original concept, High retention/viral potential, Emotional impact, Technical mastery, Scene selection on point, Audio mix balanced, No wasted frames, 4K export, 60fps, Proper bitrate, No compression artifacts

A-RANK: Great sync, Good flow, Solid transitions, Good CC, Strong opening, Mostly clean, Good concept, High quality, Minor improvements needed

B-RANK: Decent sync, Okay flow, Basic transitions, Acceptable colors, Needs polish, Some rough spots, Standard execution, Room for growth

C-RANK: Inconsistent sync, Choppy flow, Basic cuts, Flat colors, Weak hook, Loses momentum, Generic, Beginner-intermediate

D-RANK: Poor sync, No flow, Jump cuts only, No CC, No hook, Low effort, Copy-paste template, Beginner

F-RANK: No sync, Random clips, No editing, Screen record quality, Watermarks, Stolen content, Zero effort

LOW QUALITY MARKERS: 720p or lower, Choppy framerate, Compressed, Artifacts visible, Distorted audio, Peaking/clipping, Wrong aspect ratio, Blurry, Pixelated, Screen recorded, Watermarks

=== VIRALITY ASSESSMENT ===

HIGH VIRAL POTENTIAL: Hook in first 1-2s, Fast pacing, Beat drops aligned, Emotional moments, Trending audio, Text overlays, Shareable concept, Surprise/twist, High energy
LOW VIRAL POTENTIAL: Slow start, No hook, Boring pacing, Generic concept, Overused audio, Too long, Confusing, Low quality, No payoff

=== FRAME-BY-FRAME ANALYSIS ===
For each frame, evaluate:
- Color grading quality & consistency (CC work — LUTs, Lumetri, Curves usage)
- Composition & framing
- Visual effects (masking, rotoscoping, compositing, overlays, RGB split, glow, particles)
- Text/typography quality if present
- Motion blur / speed ramp indicators (Twixtor, RSMB, velocity ramping)
- Keyframe sophistication (bezier curves, expressions)
- Grain/texture/film treatment
- Overall visual polish

=== OVERALL EDIT ANALYSIS ===
- Flow & pacing (velocity edits, flow edits, hard cuts)
- Visual consistency across frames
- Color grading coherence
- Transition quality (whip pans, zoom cuts, flash transitions, dissolves)
- Technical execution level (AE-level or CapCut-level?)
- Creative vision & concept
- Storytelling / narrative arc
- Audio-visual sync indicators (beat sync, bass drops, impact frames)
- Mission fit / brief adherence when mission context is provided

=== SCORING PILLARS ===
- emotion (0-15): Emotional impact, storytelling, mood, atmosphere
- creativity (0-25): Originality, unique concepts, innovation, scene selection
- sync (0-25): Music sync, rhythm, flow, pacing, beat matching
- identity (0-10): Personal style, signature techniques, editor fingerprint
- execution (0-25): Technical quality, transitions, effects, CC, render quality

=== GRADE SCALE (total /100) ===
- S++ (95-100): Legendary — goated, museum-tier craftsmanship, cooked the entire timeline
- S+ (85-94): Elite — fire, professional studio quality, snapped
- S (75-84): Fire — genuinely impressive, this goes crazy
- A (65-74): Solid — clean work, strong fundamentals
- B (50-64): Decent — shows promise, needs polish
- C (40-49): Mid — needs significant work
- D (30-39): Below average — fundamental issues, low effort
- F (0-29): Rough — start over

=== RESPONSE FORMAT ===

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
      "observations": "<what you see — use editor terminology: CC, masking, velocity, RSMB, etc.>",
      "score_impact": "<positive/negative/neutral with specific reason>"
    }
  ],
  "strengths": ["<specific strength using editor slang>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<specific issue using editor slang>", "<issue 2>", "<issue 3>"],
  "technical_verdict": "<2-3 sentences — reference specific effects, plugins, software indicators, render quality>",
  "creative_verdict": "<2-3 sentences — concept, originality, edit style (AMV/velocity/flow), scene selection>",
  "sync_verdict": "<2-3 sentences — beat sync, bass drops, impact frames, velocity ramping, pacing>",
  "viral_potential": "<high/medium/low — assess hook strength, retention, shareability, trending elements>",
  "recommended_grade": "<S++|S+|S|A|B|C|D|F>",
  "grade_justification": "<3-4 sentences explaining why — use community language>",
  "improvement_notes": "<2-3 specific actionable improvements using editor terminology>",
  "judge_summary": "<one powerful sentence — authentic judge voice, community tone, copy-paste ready for posting>",
  "judge_feedback": "<3-5 sentences of copy-paste ready judge feedback written in authentic Discord judge session style — mix technical terms with community slang, ready to post as official judge notes>"
}

=== CRITICAL RULES ===
1. Be BRUTALLY HONEST — this is an internal judge tool. No sugarcoating.
2. REFERENCE SPECIFIC FRAMES. Say "Frame 3 shows clean masking and the CC pops" not "the masking is good."
3. S+ and S++ are EXCEPTIONALLY rare. Most edits are B-A range. Don't inflate.
4. USE EDITOR COMMUNITY LANGUAGE naturally — not corporate speak. Talk like a real judge in a Discord session.
5. The judge_feedback field must be COPY-PASTE READY for posting as official judge notes.
6. Identify edit style (AMV, velocity edit, flow edit, etc.) and judge accordingly.
7. Call out specific effects, plugins, and techniques you can identify from frames.
8. Assess viral potential based on hook, pacing, trending elements.
9. If mission context is provided, judge how well the edit matches that mission brief.
10. NEVER return anything other than the JSON object.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { frames, editorNotes, videoTitle, selectedMission, selectedEditor } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: "No frames provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

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

    const contextParts = [
      `\nAnalyze this video edit using the ${frames.length} frames extracted above.`,
      `Total frames extracted: ${frames.length}`,
    ];

    if (videoTitle) contextParts.push(`Video title: ${videoTitle}`);
    if (editorNotes) contextParts.push(`Judge notes: ${editorNotes}`);
    if (selectedEditor?.username) contextParts.push(`Target editor on Loopgate: @${selectedEditor.username}`);
    if (selectedMission?.title) {
      contextParts.push(`Mission title: ${selectedMission.title}`);
      if (selectedMission.brandOrArtist) contextParts.push(`Mission client/artist: ${selectedMission.brandOrArtist}`);
      if (selectedMission.status) contextParts.push(`Mission status: ${selectedMission.status}`);
      if (selectedMission.description) contextParts.push(`Mission brief: ${selectedMission.description}`);
      if (selectedMission.requirements) contextParts.push(`Mission requirements: ${selectedMission.requirements}`);
      contextParts.push("Judge how well the edit fits this exact mission brief in addition to normal quality scoring.");
    }

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
