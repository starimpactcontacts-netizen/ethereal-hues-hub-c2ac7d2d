import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── oEmbed fetchers ─────────────────────────────────────

interface OEmbedResult {
  thumbnail_url: string | null;
  title: string | null;
  author_name: string | null;
  html: string | null;
}

async function fetchTikTokOEmbed(url: string): Promise<OEmbedResult> {
  // Resolve short URLs first
  let resolvedUrl = url;
  if (/^https?:\/\/(vm|vt)\.tiktok\.com\//i.test(url) || /tiktok\.com\/t\//i.test(url)) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.url && !res.url.includes("/notfound")) resolvedUrl = res.url;
    } catch { /* use original */ }
  }

  // oEmbed API — fast, reliable, no auth needed
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "facebookexternalhit/1.1" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        console.log("[enrich] TikTok oEmbed success:", {
          thumb: !!data.thumbnail_url,
          title: !!data.title,
          author: !!data.author_name,
        });
        if (data.thumbnail_url) {
          return {
            thumbnail_url: data.thumbnail_url || null,
            title: data.title || null,
            author_name: data.author_name || null,
            html: data.html || null,
          };
        }
      }
    }
  } catch (e) {
    console.warn("[enrich] TikTok oEmbed failed:", e);
  }

  // Fallback: mobile page scrape for og:image / embedded JSON
  try {
    console.log("[enrich] TikTok fallback scrape for:", resolvedUrl);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(resolvedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const html = await res.text();
      let thumb: string | null = null;
      let title: string | null = null;
      let author: string | null = null;

      // Try __UNIVERSAL_DATA_FOR_REHYDRATION__
      const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
      if (universalMatch) {
        try {
          const ud = JSON.parse(universalMatch[1]);
          const vi = ud?.["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo?.itemStruct;
          if (vi) {
            thumb = vi.video?.cover || vi.video?.dynamicCover || null;
            title = vi.desc || null;
            author = vi.author?.uniqueId || vi.author?.nickname || null;
          }
        } catch { /* */ }
      }

      // og:image fallback
      if (!thumb) {
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
        if (ogMatch?.[1]) thumb = ogMatch[1];
      }

      // cover regex fallback
      if (!thumb) {
        const coverMatch = html.match(/"cover"\s*:\s*"(https?:[^"]+)"/);
        if (coverMatch) thumb = coverMatch[1].replace(/\\u002F/g, "/");
      }

      if (thumb) {
        console.log("[enrich] TikTok scrape got thumbnail");
        return { thumbnail_url: thumb, title, author_name: author, html: null };
      }
    }
  } catch (e) {
    console.warn("[enrich] TikTok scrape failed:", e);
  }

  return { thumbnail_url: null, title: null, author_name: null, html: null };
}

async function fetchInstagramOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "facebookexternalhit/1.1" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        return {
          thumbnail_url: data.thumbnail_url || null,
          title: data.title || null,
          author_name: data.author_name || null,
          html: data.html || null,
        };
      }
    }
  } catch (e) {
    console.warn("[enrich] Instagram oEmbed failed:", e);
  }
  return { thumbnail_url: null, title: null, author_name: null, html: null };
}

function resolveYouTubeMeta(url: string): OEmbedResult {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (match) {
    return {
      thumbnail_url: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
      title: null,
      author_name: null,
      html: null,
    };
  }
  return { thumbnail_url: null, title: null, author_name: null, html: null };
}

// ── DB write helpers ─────────────────────────────────────

type SupabaseClient = ReturnType<typeof createClient>;

async function writeToTable(
  supabase: SupabaseClient,
  table: string,
  rowId: string,
  data: OEmbedResult,
  side?: "challenger" | "opponent"
) {
  let updatePayload: Record<string, string | null> = {};

  if (table === "battles" && side) {
    // Battles have prefixed columns
    updatePayload = {
      [`${side}_thumbnail_url`]: data.thumbnail_url,
      [`${side}_video_title`]: data.title,
      [`${side}_author_username`]: data.author_name,
    };
  } else if (table === "judge_rating_videos") {
    updatePayload = {
      thumbnail_url: data.thumbnail_url,
      author_username: data.author_name,
      embed_html: data.html,
    };
    // judge_rating_videos uses 'title' not 'video_title'
    if (data.title) updatePayload.title = data.title;
  } else {
    // round_participations, event_participations, featured_submissions
    updatePayload = {
      thumbnail_url: data.thumbnail_url,
      author_username: data.author_name,
      embed_html: data.html,
    };
    // These tables use different title columns
    if (table === "featured_submissions") {
      updatePayload.video_title = data.title;
    } else {
      updatePayload.custom_title = data.title;
    }
  }

  // Remove null values — don't overwrite existing data with null
  const cleanPayload: Record<string, string> = {};
  for (const [k, v] of Object.entries(updatePayload)) {
    if (v != null) cleanPayload[k] = v;
  }

  if (Object.keys(cleanPayload).length === 0) {
    console.log("[enrich] No data to write for", table, rowId);
    return;
  }

  const { error } = await supabase
    .from(table)
    .update(cleanPayload)
    .eq("id", rowId);

  if (error) {
    console.error("[enrich] DB write error:", table, rowId, error.message);
  } else {
    console.log("[enrich] Wrote to", table, rowId, Object.keys(cleanPayload));
  }
}

// ── Main handler ─────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, platform, table, row_id, side } = await req.json();

    if (!url || !table || !row_id) {
      return new Response(
        JSON.stringify({ error: "url, table, and row_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect platform from URL if not provided
    const p = (platform || "").toLowerCase();
    const isTikTok = p === "tiktok" || url.includes("tiktok.com");
    const isInstagram = p === "instagram" || url.includes("instagram.com");
    const isYouTube = p === "youtube" || url.includes("youtube.com") || url.includes("youtu.be");

    // Fetch metadata via oEmbed
    let result: OEmbedResult;
    if (isTikTok) {
      result = await fetchTikTokOEmbed(url);
    } else if (isInstagram) {
      result = await fetchInstagramOEmbed(url);
    } else if (isYouTube) {
      result = resolveYouTubeMeta(url);
    } else {
      result = { thumbnail_url: null, title: null, author_name: null, html: null };
    }

    // Write to DB using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await writeToTable(supabase, table, row_id, result, side);

    return new Response(
      JSON.stringify({
        success: true,
        thumbnail_url: result.thumbnail_url,
        title: result.title,
        author_name: result.author_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[enrich] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
