import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper to parse view counts like "1.5M", "500K"
function parseViewCount(str: string): number | null {
  const match = str.match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  const suffix = match[2]?.toUpperCase();
  if (suffix === 'K') num *= 1000;
  else if (suffix === 'M') num *= 1000000;
  else if (suffix === 'B') num *= 1000000000;
  return Math.round(num);
}

async function fetchTikTokStats(url: string): Promise<{ views: number | null; thumbnailUrl: string | null }> {
  let views: number | null = null;
  let thumbnailUrl: string | null = null;

  // Resolve short URL
  let resolvedUrl = url;
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' } });
      resolvedUrl = res.url || url;
    } catch { /* use original */ }
  }

  const videoIdMatch = resolvedUrl.match(/video\/(\d+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Scrape mobile page
  try {
    const res = await fetch(resolvedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15', 'Accept': 'text/html' }
    });
    if (res.ok) {
      const html = await res.text();
      const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/);
      const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
      
      if (sigiMatch && videoId) {
        try {
          const data = JSON.parse(sigiMatch[1]);
          const v = data?.ItemModule?.[videoId];
          if (v) { views = v.stats?.playCount || null; thumbnailUrl = v.video?.cover || null; }
        } catch { /* skip */ }
      }
      if (!views && universalMatch) {
        try {
          const data = JSON.parse(universalMatch[1]);
          const v = data?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.itemInfo?.itemStruct;
          if (v) { views = v.stats?.playCount || null; thumbnailUrl = v.video?.cover || null; }
        } catch { /* skip */ }
      }
      if (!views) {
        const m = html.match(/"playCount"\s*:\s*(\d+)/);
        if (m) views = parseInt(m[1], 10);
      }
      if (!thumbnailUrl) {
        const m = html.match(/"cover"\s*:\s*"([^"]+)"/);
        if (m) thumbnailUrl = m[1].replace(/\\u002F/g, '/');
      }
    }
  } catch { /* skip */ }

  // oEmbed fallback for thumbnail
  if (!thumbnailUrl) {
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
      if (res.ok) { const d = await res.json(); thumbnailUrl = d.thumbnail_url || null; }
    } catch { /* skip */ }
  }

  return { views, thumbnailUrl };
}

async function fetchYouTubeStats(url: string): Promise<{ views: number | null; thumbnailUrl: string | null }> {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match) {
    return { views: null, thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` };
  }
  return { views: null, thumbnailUrl: null };
}

async function fetchInstagramStats(url: string): Promise<{ views: number | null; thumbnailUrl: string | null }> {
  try {
    const res = await fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    if (res.ok) { const d = await res.json(); return { views: null, thumbnailUrl: d.thumbnail_url || null }; }
  } catch { /* skip */ }
  return { views: null, thumbnailUrl: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting video stats refresh...');

    // Fetch all judge rating videos
    const { data: videos, error } = await supabase
      .from('judge_rating_videos')
      .select('id, video_url, platform, current_views, thumbnail_url')
      .order('submitted_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    let updated = 0;
    let thumbnailsUpdated = 0;

    for (const video of (videos || [])) {
      try {
        let stats: { views: number | null; thumbnailUrl: string | null } = { views: null, thumbnailUrl: null };

        if (video.platform === 'tiktok') stats = await fetchTikTokStats(video.video_url);
        else if (video.platform === 'youtube') stats = await fetchYouTubeStats(video.video_url);
        else if (video.platform === 'instagram') stats = await fetchInstagramStats(video.video_url);

        const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

        if (stats.views !== null && stats.views !== video.current_views) {
          updatePayload.current_views = stats.views;
          updated++;
        }

        // Cache thumbnail if not already set
        if (stats.thumbnailUrl && !video.thumbnail_url) {
          updatePayload.thumbnail_url = stats.thumbnailUrl;
          thumbnailsUpdated++;
        }

        if (Object.keys(updatePayload).length > 1) {
          await supabase
            .from('judge_rating_videos')
            .update(updatePayload)
            .eq('id', video.id);
        }

        // Rate limit: small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`Error processing video ${video.id}:`, e);
      }
    }

    console.log(`Refresh complete. Views updated: ${updated}, Thumbnails cached: ${thumbnailsUpdated}, Total processed: ${videos?.length || 0}`);

    return new Response(
      JSON.stringify({ success: true, processed: videos?.length || 0, viewsUpdated: updated, thumbnailsCached: thumbnailsUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refresh error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
