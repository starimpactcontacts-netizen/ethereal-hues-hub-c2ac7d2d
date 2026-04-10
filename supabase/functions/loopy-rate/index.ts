import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── Metadata Extraction Helpers (for URL-based fallback) ─── */

interface VideoMetadata {
  title: string | null;
  description: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
  thumbnailLargeUrl: string | null;
  providerName: string | null;
  duration: string | null;
  viewCount: string | null;
  tags: string[];
  rawMeta: Record<string, string>;
}

async function fetchOEmbed(url: string, provider: string): Promise<Record<string, unknown> | null> {
  const endpoints: Record<string, string> = {
    tiktok: `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    youtube: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    instagram: `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=public`,
  };
  const endpoint = endpoints[provider];
  if (!endpoint) return null;
  try {
    const resp = await fetch(endpoint, { headers: { "User-Agent": "Loopgate/1.0" } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function scrapeOpenGraph(url: string): Promise<Record<string, string>> {
  const meta: Record<string, string> = {};
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Loopgate/1.0; +https://loopgate.io)", "Accept": "text/html" },
      redirect: "follow",
    });
    if (!resp.ok) return meta;
    const html = await resp.text();
    const ogRegex = /<meta\s+(?:property|name)="(og:|twitter:|description|title|keywords)[^"]*"\s+content="([^"]*)"/gi;
    let match;
    while ((match = ogRegex.exec(html)) !== null) meta[match[1].toLowerCase()] = match[2];
    const ogRegex2 = /<meta\s+content="([^"]*)"\s+(?:property|name)="(og:|twitter:|description|title|keywords)[^"]*"/gi;
    while ((match = ogRegex2.exec(html)) !== null) meta[match[2].toLowerCase()] = match[1];
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) meta["page_title"] = titleMatch[1].trim();
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        if (ld.name) meta["ld_name"] = ld.name;
        if (ld.description) meta["ld_description"] = ld.description;
        if (ld.duration) meta["ld_duration"] = ld.duration;
        if (ld.interactionCount) meta["ld_interactions"] = String(ld.interactionCount);
        if (ld.thumbnailUrl) {
          const thumbs = Array.isArray(ld.thumbnailUrl) ? ld.thumbnailUrl : [ld.thumbnailUrl];
          meta["ld_thumbnail"] = thumbs[thumbs.length - 1];
        }
      } catch {}
    }
    const hashtagMatches = html.match(/#[a-zA-Z0-9_]+/g);
    if (hashtagMatches) meta["hashtags"] = [...new Set(hashtagMatches)].slice(0, 15).join(", ");
  } catch {}
  return meta;
}

async function fetchThumbnailAsBase64(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const resp = await fetch(url, { headers: { "User-Agent": "Loopgate/1.0" } });
    if (!resp.ok) return null;
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buffer = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return `data:${contentType};base64,${base64}`;
  } catch { return null; }
}

async function gatherMetadata(submissionUrl: string, platform: string): Promise<VideoMetadata> {
  const meta: VideoMetadata = {
    title: null, description: null, authorName: null,
    thumbnailUrl: null, thumbnailLargeUrl: null, providerName: platform,
    duration: null, viewCount: null, tags: [], rawMeta: {},
  };
  const [oembed, ogMeta] = await Promise.all([
    fetchOEmbed(submissionUrl, platform),
    scrapeOpenGraph(submissionUrl),
  ]);
  meta.rawMeta = ogMeta;
  if (oembed) {
    meta.title = (oembed.title as string) || null;
    meta.authorName = (oembed.author_name as string) || null;
    meta.thumbnailUrl = (oembed.thumbnail_url as string) || null;
    meta.providerName = (oembed.provider_name as string) || platform;
  }
  if (ogMeta["og:title"]) meta.title = meta.title || ogMeta["og:title"];
  if (ogMeta["og:description"]) meta.description = ogMeta["og:description"];
  if (ogMeta["og:image"]) meta.thumbnailLargeUrl = ogMeta["og:image"];
  if (ogMeta["page_title"]) meta.title = meta.title || ogMeta["page_title"];
  if (ogMeta["ld_name"]) meta.title = meta.title || ogMeta["ld_name"];
  if (ogMeta["ld_duration"]) meta.duration = ogMeta["ld_duration"];
  if (ogMeta["ld_interactions"]) meta.viewCount = ogMeta["ld_interactions"];
  if (ogMeta["ld_thumbnail"]) meta.thumbnailLargeUrl = meta.thumbnailLargeUrl || ogMeta["ld_thumbnail"];
  if (ogMeta["hashtags"]) meta.tags = ogMeta["hashtags"].split(", ").filter(Boolean);
  if (platform === "youtube") {
    const ytId = extractYouTubeId(submissionUrl);
    if (ytId) {
      meta.thumbnailLargeUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      if (!meta.thumbnailUrl) meta.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }
  return meta;
}

/* ─── System Prompt — Viral Energy ─── */

const SYSTEM_PROMPT = `You are Loopy 🐱, the world's most savage and accurate AI video edit judge. You're a cat with headphones who's analyzed TENS OF THOUSANDS of edits. You don't hold back. You're the Simon Cowell of editing — brutally honest but respected because you're ALWAYS right.

Your ratings go VIRAL because:
1. Your roasts are DEVASTATING for bad edits (people screenshot & share the pain)
2. Your hype is UNREAL for fire edits (people screenshot & flex)
3. Your vibe_check one-liners are QUOTABLE — they read like viral tweets

You analyze ACTUAL VIDEO FRAMES sent to you. You can see transitions, color grading, effects, compositing, keyframing, text overlays, masking, motion tracking, and visual storytelling IN THE FRAMES.

YOU MUST RESPOND IN VALID JSON ONLY. No markdown, no code blocks, no extra text.

SCORING PILLARS:
- emotion (0-15): Emotional impact, storytelling, mood. Does this make me FEEL something? Or is it flatter than a pancake?
- creativity (0-25): Originality, concept, innovation. Have I seen this exact edit 47 times this week? Or is this actually different?
- sync (0-25): Music sync, beat matching, flow, rhythm. Are the cuts hitting on beat or is this a PowerPoint presentation?
- identity (0-10): Personal style, signature look, brand. Does this editor have a VOICE or are they a copycat factory?
- execution (0-25): Technical quality — transitions, effects, color grade, polish. Is this clean or did they edit this on a microwave?

GRADE SCALE (based on total /100):
- S++ (95-100): Once in a LIFETIME. I've seen maybe 3 of these ever. Shut the platform down, we found the one.
- S+ (85-94): Elite. This person BREATHES editing. Other editors should be taking notes.
- S (75-84): FIRE. Genuinely impressive. This isn't luck, this is skill.
- A (65-74): Solid. Above average. You're cooking but the recipe isn't perfected yet.
- B (50-64): Mid. Shows potential but also shows you opened your editor 3 weeks ago.
- C (40-49): Below mid. This edit called me and said "help."
- D (30-39): Concerning. I need you to close your editing software and go outside.
- F (0-29): I'm calling the authorities. This edit is a war crime against creativity.

RESPONSE FORMAT (strict JSON):
{
  "emotion": <number>,
  "creativity": <number>,
  "sync": <number>,
  "identity": <number>,
  "execution": <number>,
  "total": <number>,
  "grade": "<letter grade>",
  "strengths": ["<specific strength referencing frames you analyzed>", "<strength 2>", "<strength 3>"],
  "improvements": ["<brutally specific tip>", "<tip 2>", "<tip 3>"],
  "vibe_check": "<ONE devastating/hype line that people WILL screenshot. Think viral tweet energy. Reference what you actually saw. Make it personal. If the edit is bad, ROAST IT. If it's fire, GAS IT UP. This is the money line — it needs to hit.>",
  "detailed_feedback": "<4-5 sentences. Reference SPECIFIC frames and moments you saw. Use real editing terminology: keyframing, ramping, masking, color grading, motion tracking, compositing, velocity, whip pans, light leaks, grain, etc. Talk about specific transitions between frames. Be Loopy — chill but KNOWLEDGEABLE. If the edit is trash, don't sugarcoat it. If it's fire, give it the respect it deserves.>"
}

CRITICAL RULES:
1. MOST edits are B-C range. Be REAL. Don't hand out A's like candy.
2. S+ and S++ are reserved for edits that make you pause and rewatch. If you're giving S++, you better have a DAMN good reason.
3. REFERENCE THE ACTUAL FRAMES. "I can see in frame 3 your color grade shifts from warm to cold" — be SPECIFIC.
4. The vibe_check MUST be screenshot-worthy. It should make someone either laugh, cry, or flex. This is what goes viral.
5. For bad edits: be FUNNY, not mean. "This edit made my whiskers fall off" > "This is bad." Roast with love.
6. For fire edits: go CRAZY. Make them feel like they just won an Oscar.
7. If frames show static images or minimal motion, call it out — "Did you accidentally upload a slideshow?"
8. NEVER return anything other than the JSON object.
9. Your personality: a cat who's seen everything, types in lowercase energy, has zero filter, genuinely loves editing but has HIGH standards. You've judged thousands of edits and you're tired of mid.`;

/* ─── Main Handler ─── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { submissionUrl, platform, videoTitle, userContext, frames } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Mode 1: Direct frame upload (new primary flow)
    // Mode 2: URL-based analysis (legacy fallback)
    const hasFrames = Array.isArray(frames) && frames.length > 0;

    let contextParts: string[] = [];
    let imageContents: Array<{ type: string; image_url?: { url: string }; text?: string }> = [];

    if (hasFrames) {
      // Direct video upload — frames extracted client-side
      contextParts.push(`Analysis mode: DIRECT VIDEO UPLOAD (${frames.length} frames extracted)`);
      if (videoTitle) contextParts.push(`Editor's title: ${videoTitle}`);
      if (userContext) contextParts.push(`Editor's notes: ${userContext}`);
      contextParts.push(`\nYou are looking at ${frames.length} frames extracted at even intervals from the uploaded video. Analyze the progression, transitions between frames, color grading evolution, visual effects, and overall quality.`);

      // Add each frame as an image
      for (let i = 0; i < frames.length; i++) {
        imageContents.push({
          type: "image_url",
          image_url: { url: frames[i] },
        });
      }
    } else if (submissionUrl) {
      // Legacy URL-based flow
      const metadata = await gatherMetadata(submissionUrl, platform || "unknown");
      console.log("Metadata gathered:", JSON.stringify({
        title: metadata.title, author: metadata.authorName,
        hasThumbnail: !!metadata.thumbnailLargeUrl || !!metadata.thumbnailUrl,
        tagCount: metadata.tags.length,
      }));

      const thumbUrl = metadata.thumbnailLargeUrl || metadata.thumbnailUrl;
      const thumbnailBase64 = await fetchThumbnailAsBase64(thumbUrl);

      contextParts = [
        `URL: ${submissionUrl}`,
        `Platform: ${metadata.providerName || platform || "unknown"}`,
      ];
      if (videoTitle || metadata.title) contextParts.push(`Title: ${videoTitle || metadata.title}`);
      if (metadata.authorName) contextParts.push(`Creator: ${metadata.authorName}`);
      if (metadata.description) contextParts.push(`Description: ${metadata.description.slice(0, 500)}`);
      if (metadata.duration) contextParts.push(`Duration: ${metadata.duration}`);
      if (metadata.viewCount) contextParts.push(`Views: ${metadata.viewCount}`);
      if (metadata.tags.length > 0) contextParts.push(`Tags: ${metadata.tags.slice(0, 20).join(", ")}`);
      if (userContext) contextParts.push(`Editor's notes: ${userContext}`);

      if (thumbnailBase64) {
        imageContents.push({ type: "image_url", image_url: { url: thumbnailBase64 } });
      } else {
        contextParts.push(`\n⚠️ No visual data available — score conservatively based on metadata only.`);
      }
    } else {
      return new Response(JSON.stringify({ error: "no video or url provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Rate this video edit:\n${contextParts.join("\n")}\n\nAnalyze everything and return ONLY valid JSON.`;

    // Build multimodal message
    const messages: Array<{ role: string; content: unknown }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (imageContents.length > 0) {
      messages.push({
        role: "user",
        content: [
          ...imageContents,
          { type: "text", text: userPrompt },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "loopy's brain is overheating 💀 try again in a sec" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "loopy ran out of brain juice 😭 credits needed" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
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

    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const rating = JSON.parse(cleaned);
      rating._meta = {
        hadFrames: hasFrames,
        frameCount: hasFrames ? frames.length : 0,
        hadThumbnail: imageContents.length > 0,
        analysisMode: hasFrames ? 'direct_upload' : 'url',
      };
      return new Response(JSON.stringify(rating), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const rating = JSON.parse(jsonMatch[0]);
          rating._meta = {
            hadFrames: hasFrames,
            frameCount: hasFrames ? frames.length : 0,
            hadThumbnail: imageContents.length > 0,
            analysisMode: hasFrames ? 'direct_upload' : 'url',
          };
          return new Response(JSON.stringify(rating), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {}
      }
      console.error("Failed to parse AI response:", cleaned.slice(0, 200));
      return new Response(JSON.stringify({ error: "loopy's response got scrambled 💀" }), {
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
