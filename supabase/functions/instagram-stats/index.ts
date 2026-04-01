import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Extract Instagram media shortcode from URL
function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// Fetch stats for a single Instagram post using the Graph API
async function fetchInstagramPostStats(url: string, accessToken: string): Promise<{
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
}> {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    console.log('Could not extract shortcode from:', url);
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }

  try {
    // First, search for the media by shortcode using the Graph API
    // We need to get our IG user ID first, then query media
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );
    if (!meRes.ok) {
      const errText = await meRes.text();
      console.error('Instagram /me error:', errText);
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }
    const meData = await meRes.json();
    const igUserId = meData.id;

    // Fetch recent media to find the matching post
    const mediaRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media?fields=id,shortcode,permalink,media_type,thumbnail_url,like_count,comments_count,timestamp&limit=50&access_token=${accessToken}`
    );
    if (!mediaRes.ok) {
      const errText = await mediaRes.text();
      console.error('Instagram media list error:', errText);
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }
    const mediaData = await mediaRes.json();

    // Find matching media by shortcode or permalink
    const matchingMedia = (mediaData.data || []).find((m: any) =>
      m.shortcode === shortcode || m.permalink?.includes(shortcode)
    );

    if (!matchingMedia) {
      console.log('No matching media found for shortcode:', shortcode);
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    // For reels/videos, try to get insights (reach/views)
    let views: number | null = null;
    if (matchingMedia.media_type === 'VIDEO' || matchingMedia.media_type === 'REEL') {
      try {
        const insightsRes = await fetch(
          `https://graph.instagram.com/${matchingMedia.id}/insights?metric=plays,reach&access_token=${accessToken}`
        );
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          for (const metric of (insightsData.data || [])) {
            if (metric.name === 'plays') {
              views = metric.values?.[0]?.value || null;
            }
          }
        }
      } catch (e) {
        console.error('Insights fetch error:', e);
      }
    }

    return {
      views,
      likes: matchingMedia.like_count || null,
      comments: matchingMedia.comments_count || null,
      thumbnailUrl: matchingMedia.thumbnail_url || null,
    };
  } catch (e) {
    console.error('Instagram API error:', e);
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Instagram access token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, action } = await req.json();

    // Single URL lookup
    if (action === 'get-stats' && url) {
      const stats = await fetchInstagramPostStats(url, accessToken);
      return new Response(
        JSON.stringify({ success: true, ...stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch refresh: update all Instagram campaign edits
    if (action === 'refresh-all') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: edits, error } = await supabase
        .from('artist_campaign_edits')
        .select('id, video_url, view_count, like_count, comment_count, thumbnail_url')
        .or('platform.eq.instagram,video_url.ilike.%instagram.com%')
        .limit(100);

      if (error) throw error;

      let updated = 0;
      for (const edit of (edits || [])) {
        if (!edit.video_url) continue;
        try {
          const stats = await fetchInstagramPostStats(edit.video_url, accessToken);
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };

          if (stats.views !== null) { payload.view_count = stats.views; }
          if (stats.likes !== null) { payload.like_count = stats.likes; }
          if (stats.comments !== null) { payload.comment_count = stats.comments; }
          if (stats.thumbnailUrl && !edit.thumbnail_url) { payload.thumbnail_url = stats.thumbnailUrl; }

          if (Object.keys(payload).length > 1) {
            await supabase.from('artist_campaign_edits').update(payload).eq('id', edit.id);
            updated++;
          }

          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          console.error(`Error updating edit ${edit.id}:`, e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed: edits?.length || 0, updated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "get-stats" or "refresh-all".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Instagram stats error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
