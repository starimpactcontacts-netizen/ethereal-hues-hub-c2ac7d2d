import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function fetchViaEmbed(shortcode: string): Promise<{
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
}> {
  try {
    // Try both /p/ and /reel/ embed URLs
    for (const prefix of ['p', 'reel']) {
      const embedUrl = `https://www.instagram.com/${prefix}/${shortcode}/embed/captioned/`;
      console.log('Trying embed:', embedUrl);

      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.google.com/',
        },
      });

      if (!res.ok) {
        console.log(`Embed ${prefix} HTTP:`, res.status);
        continue;
      }

      const html = await res.text();
      console.log('Embed HTML length:', html.length);
      
      // Debug: log a sample of what we got
      const hasLikes = html.includes('like');
      const hasViews = html.includes('view');
      const hasGqlData = html.includes('gql_data');
      const hasShortcode = html.includes(shortcode);
      console.log('Content check:', { hasLikes, hasViews, hasGqlData, hasShortcode, prefix });

      // Extract likes - multiple patterns
      let likes: number | null = null;
      const likesPatterns = [
        /likes_count[^\d]{0,5}(\d+)/,
        /edge_liked_by[^\d]{0,15}(\d+)/,
        /like_count[^\d]{0,5}(\d+)/,
        /([\d,]+)\s*likes/,
      ];
      for (const p of likesPatterns) {
        const m = html.match(p);
        if (m) {
          likes = parseInt(m[1].replace(/,/g, ''), 10);
          console.log('Likes matched pattern:', p.source, '=', likes);
          break;
        }
      }

      // Extract views
      let views: number | null = null;
      const viewsPatterns = [
        /video_view_count[^\d]{0,5}(\d+)/,
        /video_play_count[^\d]{0,5}(\d+)/,
        /play_count[^\d]{0,5}(\d+)/,
        /([\d,]+)\s*views/,
      ];
      for (const p of viewsPatterns) {
        const m = html.match(p);
        if (m) {
          views = parseInt(m[1].replace(/,/g, ''), 10);
          console.log('Views matched pattern:', p.source, '=', views);
          break;
        }
      }

      // Extract comments
      let comments: number | null = null;
      const commentsPatterns = [
        /commenter_count[^\d]{0,5}(\d+)/,
        /edge_media_to_parent_comment[^\d]{0,15}(\d+)/,
        /comment_count[^\d]{0,5}(\d+)/,
      ];
      for (const p of commentsPatterns) {
        const m = html.match(p);
        if (m) {
          comments = parseInt(m[1].replace(/,/g, ''), 10);
          break;
        }
      }

      // Extract thumbnail
      let thumbnailUrl: string | null = null;
      const displayMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayMatch) {
        thumbnailUrl = displayMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      }
      if (!thumbnailUrl) {
        const ogMatch = html.match(/content="([^"]+)"\s+property="og:image"/i)
          || html.match(/property="og:image"\s+content="([^"]+)"/i);
        if (ogMatch) thumbnailUrl = ogMatch[1];
      }

      if (likes !== null || views !== null) {
        console.log('✅ Got stats from embed:', { views, likes, comments, thumb: !!thumbnailUrl });
        return { views, likes, comments, thumbnailUrl };
      }
    }

    console.log('❌ No stats found from embed');
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  } catch (e) {
    console.error('Embed error:', e);
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }
}

async function fetchInstagramPostStats(url: string): Promise<{
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

  return await fetchViaEmbed(shortcode);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, action } = await req.json();

    if (action === 'get-stats' && url) {
      const stats = await fetchInstagramPostStats(url);
      return new Response(
        JSON.stringify({ success: true, ...stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
          const stats = await fetchInstagramPostStats(edit.video_url);
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };
          if (stats.views !== null) payload.view_count = stats.views;
          if (stats.likes !== null) payload.like_count = stats.likes;
          if (stats.comments !== null) payload.comment_count = stats.comments;
          if (stats.thumbnailUrl && !edit.thumbnail_url) payload.thumbnail_url = stats.thumbnailUrl;

          if (Object.keys(payload).length > 1) {
            await supabase.from('artist_campaign_edits').update(payload).eq('id', edit.id);
            updated++;
          }
          await new Promise(r => setTimeout(r, 1500));
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
      JSON.stringify({ error: 'Invalid action' }),
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
