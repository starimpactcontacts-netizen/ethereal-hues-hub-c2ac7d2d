import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── Metadata Extraction Helpers ─── */

interface VideoMetadata {
  title: string | null;
  description: string | null;
  authorName: string | null;
  authorUrl: string | null;
  thumbnailUrl: string | null;
  thumbnailLargeUrl: string | null;
  providerName: string | null;
  embedHtml: string | null;
  duration: string | null;
  viewCount: string | null;
  likeCount: string | null;
  commentCount: string | null;
  uploadDate: string | null;
  tags: string[];
  rawOembed: Record<string, unknown> | null;
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

async function fetchYouTubeNoembed(url: string): Promise<Record<string, unknown> | null> {
  try {
    const resp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch { return null; }
}

async function scrapeOpenGraph(url: string): Promise<Record<string, string>> {
  const meta: Record<string, string> = {};
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Loopgate/1.0; +https://loopgate.io)",
        "Accept": "text/html",
      },
      redirect: "follow",
    });
    if (!resp.ok) return meta;
    const html = await resp.text();

    // Extract meta tags
    const ogRegex = /<meta\s+(?:property|name)="(og:|twitter:|description|title|keywords)[^"]*"\s+content="([^"]*)"/gi;
    let match;
    while ((match = ogRegex.exec(html)) !== null) {
      meta[match[1].toLowerCase()] = match[2];
    }
    // Also try content-first pattern
    const ogRegex2 = /<meta\s+content="([^"]*)"\s+(?:property|name)="(og:|twitter:|description|title|keywords)[^"]*"/gi;
    while ((match = ogRegex2.exec(html)) !== null) {
      meta[match[2].toLowerCase()] = match[1];
    }

    // Extract title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) meta["page_title"] = titleMatch[1].trim();

    // Extract JSON-LD if available
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        if (ld.name) meta["ld_name"] = ld.name;
        if (ld.description) meta["ld_description"] = ld.description;
        if (ld.duration) meta["ld_duration"] = ld.duration;
        if (ld.interactionCount) meta["ld_interactions"] = String(ld.interactionCount);
        if (ld.uploadDate) meta["ld_upload_date"] = ld.uploadDate;
        if (ld.genre) meta["ld_genre"] = ld.genre;
        if (ld.keywords) meta["ld_keywords"] = typeof ld.keywords === 'string' ? ld.keywords : JSON.stringify(ld.keywords);
        if (ld.commentCount) meta["ld_comment_count"] = String(ld.commentCount);
        if (ld.author?.name) meta["ld_author"] = ld.author.name;
        if (ld.thumbnailUrl) {
          const thumbs = Array.isArray(ld.thumbnailUrl) ? ld.thumbnailUrl : [ld.thumbnailUrl];
          meta["ld_thumbnail"] = thumbs[thumbs.length - 1]; // largest
        }
      } catch { /* ignore parse errors */ }
    }

    // TikTok-specific: extract video description from SIGI_STATE or similar
    const sigiMatch = html.match(/"desc"\s*:\s*"([^"]{1,500})"/);
    if (sigiMatch) meta["tiktok_desc"] = sigiMatch[1];

    const hashtagMatches = html.match(/#[a-zA-Z0-9_]+/g);
    if (hashtagMatches) meta["hashtags"] = [...new Set(hashtagMatches)].slice(0, 15).join(", ");

  } catch { /* fetch failed */ }
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
    title: null, description: null, authorName: null, authorUrl: null,
    thumbnailUrl: null, thumbnailLargeUrl: null, providerName: platform,
    embedHtml: null, duration: null, viewCount: null, likeCount: null,
    commentCount: null, uploadDate: null, tags: [], rawOembed: null, rawMeta: {},
  };

  // Run oEmbed, noembed, and OG scraping in parallel
  const [oembed, noembed, ogMeta] = await Promise.all([
    fetchOEmbed(submissionUrl, platform),
    fetchYouTubeNoembed(submissionUrl),
    scrapeOpenGraph(submissionUrl),
  ]);

  meta.rawOembed = oembed;
  meta.rawMeta = ogMeta;

  // oEmbed data
  if (oembed) {
    meta.title = (oembed.title as string) || null;
    meta.authorName = (oembed.author_name as string) || null;
    meta.authorUrl = (oembed.author_url as string) || null;
    meta.thumbnailUrl = (oembed.thumbnail_url as string) || null;
    meta.embedHtml = (oembed.html as string) || null;
    meta.providerName = (oembed.provider_name as string) || platform;
  }

  // noembed fallback
  if (noembed && !meta.title) {
    meta.title = (noembed.title as string) || meta.title;
    meta.authorName = (noembed.author_name as string) || meta.authorName;
    meta.thumbnailUrl = (noembed.thumbnail_url as string) || meta.thumbnailUrl;
  }

  // OG meta enrichment
  if (ogMeta["og:title"]) meta.title = meta.title || ogMeta["og:title"];
  if (ogMeta["og:description"]) meta.description = ogMeta["og:description"];
  if (ogMeta["og:image"]) meta.thumbnailLargeUrl = ogMeta["og:image"];
  if (ogMeta["description"]) meta.description = meta.description || ogMeta["description"];
  if (ogMeta["page_title"]) meta.title = meta.title || ogMeta["page_title"];

  // JSON-LD enrichment
  if (ogMeta["ld_name"]) meta.title = meta.title || ogMeta["ld_name"];
  if (ogMeta["ld_description"]) meta.description = meta.description || ogMeta["ld_description"];
  if (ogMeta["ld_duration"]) meta.duration = ogMeta["ld_duration"];
  if (ogMeta["ld_interactions"]) meta.viewCount = ogMeta["ld_interactions"];
  if (ogMeta["ld_upload_date"]) meta.uploadDate = ogMeta["ld_upload_date"];
  if (ogMeta["ld_comment_count"]) meta.commentCount = ogMeta["ld_comment_count"];
  if (ogMeta["ld_author"]) meta.authorName = meta.authorName || ogMeta["ld_author"];
  if (ogMeta["ld_thumbnail"]) meta.thumbnailLargeUrl = meta.thumbnailLargeUrl || ogMeta["ld_thumbnail"];
  if (ogMeta["ld_keywords"]) meta.tags = ogMeta["ld_keywords"].split(",").map(t => t.trim()).filter(Boolean);

  // Hashtags
  if (ogMeta["hashtags"]) {
    const ht = ogMeta["hashtags"].split(", ").filter(Boolean);
    meta.tags = [...new Set([...meta.tags, ...ht])];
  }
  if (ogMeta["tiktok_desc"]) meta.description = meta.description || ogMeta["tiktok_desc"];

  // YouTube: get maxresdefault thumbnail
  if (platform === "youtube") {
    const ytId = extractYouTubeId(submissionUrl);
    if (ytId) {
      meta.thumbnailLargeUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
      if (!meta.thumbnailUrl) meta.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
  }

  return meta;
}

/* ─── System Prompt ─── */

const SYSTEM_PROMPT = `You are Loopy 🐱, the official AI judge of Loopgate — the world's #1 competitive video editing platform. You're a cat with headphones who's analyzed THOUSANDS of edits across AMV, short-form content, music videos, and creative edits. You rate them like a real professional judge.

Your job: Analyze everything provided — the thumbnail/frame image, video metadata (title, description, hashtags, view counts, duration, platform), and any user context. Use ALL available data to form your assessment.

YOU MUST RESPOND IN VALID JSON ONLY. No markdown, no code blocks, no extra text. Just raw JSON.

WHAT YOU CAN ANALYZE FROM THE DATA:
- THUMBNAIL/FRAME: Color grading quality, composition, visual effects visible, text overlays, keyframe sophistication, masking quality, motion blur, grain/texture choices, color palette, contrast ratios, overall visual polish
- TITLE & DESCRIPTION: Concept originality, storytelling intent, creative vision
- HASHTAGS/TAGS: Community engagement, trend awareness, content categorization
- VIEW/ENGAGEMENT COUNTS: Community reception (high views = generally well received)
- DURATION: Pacing expectations (shorter = tighter cuts needed, longer = narrative complexity)
- PLATFORM: Platform-specific standards (TikTok = fast cuts, trend-aware; YouTube = longer form, narrative; IG = aesthetic polish)
- AUTHOR: If recognizable, factor in their known style evolution

SCORING PILLARS (each out of max):
- emotion (0-15): Emotional impact, storytelling, mood setting. Judge from thumbnail mood, color grading warmth/coldness, title narrative intent, description themes.
- creativity (0-25): Originality, unique concepts, innovative techniques. Judge from visual uniqueness in thumbnail, concept described in title, hashtag originality vs trend-following.
- sync (0-25): Music synchronization, beat matching, flow. Judge from title mentioning song/artist, any beat-sync indicators, editing rhythm visible in frame composition.
- identity (0-10): Personal style, signature techniques, branding. Judge from consistent aesthetic in thumbnail, recognizable style elements, watermark/branding.
- execution (0-25): Technical quality, transitions, effects, polish. Judge HEAVILY from thumbnail — sharpness, effects quality, compositing, color grade precision, text styling, overlay quality.

GRADE SCALE (based on total /100):
- S++ (95-100): Legendary — once in a thousand
- S+ (85-94): Elite tier
- S (75-84): Fire — genuinely impressive
- A (65-74): Solid work
- B (50-64): Decent, shows promise
- C (40-49): Mid, needs improvement
- D (30-39): Below average
- F (0-29): Rough start

RESPONSE FORMAT (strict JSON):
{
  "emotion": <number>,
  "creativity": <number>,
  "sync": <number>,
  "identity": <number>,
  "execution": <number>,
  "total": <number>,
  "grade": "<letter grade>",
  "strengths": ["<specific strength referencing what you see>", "<strength 2>", "<strength 3>"],
  "improvements": ["<specific actionable tip>", "<tip 2>", "<tip 3>"],
  "vibe_check": "<one catchy shareable line — viral tweet energy>",
  "detailed_feedback": "<3-4 sentences of real feedback referencing specific things you observed in the thumbnail, metadata, and context. Use editing terminology: keyframing, ramping, masking, color grading, motion tracking, compositing, etc. Be in loopy's chill but knowledgeable voice.>"
}

CRITICAL RULES:
1. Be FAIR — most edits should land B-A range. S+ and S++ are EXCEPTIONALLY rare.
2. REFERENCE SPECIFIC THINGS you observe. Don't be generic. If you see warm color grading in the thumbnail, mention it. If the title references a specific anime/song, factor that in.
3. The vibe_check should be memorable and screenshot-worthy.
4. If you have LIMITED data (e.g., no thumbnail loaded), be transparent about it and score more conservatively.
5. Your personality: knowledgeable cat, lowercase energy, real opinions, brutally honest but constructive.
6. NEVER return anything other than the JSON object.`;

/* ─── Main Handler ─── */

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

    // Gather all metadata in parallel
    const metadata = await gatherMetadata(submissionUrl, platform || "unknown");
    console.log("Metadata gathered:", JSON.stringify({
      title: metadata.title,
      author: metadata.authorName,
      hasThumbnail: !!metadata.thumbnailLargeUrl || !!metadata.thumbnailUrl,
      hasDescription: !!metadata.description,
      tagCount: metadata.tags.length,
      duration: metadata.duration,
      viewCount: metadata.viewCount,
    }));

    // Fetch thumbnail for visual analysis
    const thumbUrl = metadata.thumbnailLargeUrl || metadata.thumbnailUrl;
    const thumbnailBase64 = await fetchThumbnailAsBase64(thumbUrl);
    console.log("Thumbnail fetched:", !!thumbnailBase64);

    // Build comprehensive prompt
    const contextParts: string[] = [
      `URL: ${submissionUrl}`,
      `Platform: ${metadata.providerName || platform || "unknown"}`,
    ];
    if (videoTitle || metadata.title) contextParts.push(`Title: ${videoTitle || metadata.title}`);
    if (metadata.authorName) contextParts.push(`Creator: ${metadata.authorName}`);
    if (metadata.description) contextParts.push(`Description: ${metadata.description.slice(0, 500)}`);
    if (metadata.duration) contextParts.push(`Duration: ${metadata.duration}`);
    if (metadata.viewCount) contextParts.push(`Views: ${metadata.viewCount}`);
    if (metadata.likeCount) contextParts.push(`Likes: ${metadata.likeCount}`);
    if (metadata.commentCount) contextParts.push(`Comments: ${metadata.commentCount}`);
    if (metadata.uploadDate) contextParts.push(`Upload Date: ${metadata.uploadDate}`);
    if (metadata.tags.length > 0) contextParts.push(`Tags/Hashtags: ${metadata.tags.slice(0, 20).join(", ")}`);
    if (userContext) contextParts.push(`Editor's notes: ${userContext}`);
    if (!thumbnailBase64) contextParts.push(`\n⚠️ Could not load thumbnail — base your analysis on metadata only and note this limitation.`);

    const userPrompt = `Rate this video edit:\n${contextParts.join("\n")}\n\nAnalyze everything available and return ONLY valid JSON.`;

    // Build messages with multimodal content if thumbnail available
    const messages: Array<{ role: string; content: unknown }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (thumbnailBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: thumbnailBase64 },
          },
          {
            type: "text",
            text: userPrompt,
          },
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
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.6,
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
        return new Response(JSON.stringify({ error: "loopy ran out of brain juice 😭" }), {
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

    // Parse JSON from response
    let cleaned = content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const rating = JSON.parse(cleaned);
      // Attach metadata for the frontend
      rating._meta = {
        thumbnailUrl: thumbUrl,
        authorName: metadata.authorName,
        videoTitle: metadata.title,
        viewCount: metadata.viewCount,
        duration: metadata.duration,
        hadThumbnail: !!thumbnailBase64,
        tagCount: metadata.tags.length,
      };
      return new Response(JSON.stringify(rating), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rating = JSON.parse(jsonMatch[0]);
        rating._meta = { thumbnailUrl: thumbUrl, hadThumbnail: !!thumbnailBase64 };
        return new Response(JSON.stringify(rating), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Failed to parse AI response:", content);
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
