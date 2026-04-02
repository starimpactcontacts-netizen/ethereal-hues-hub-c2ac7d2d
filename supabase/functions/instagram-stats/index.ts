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

// Primary method: Instagram GraphQL API (no auth needed)
async function fetchViaGraphQL(shortcode: string): Promise<{
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
}> {
  try {
    console.log('Trying Instagram GraphQL for shortcode:', shortcode);
    
    const variables = JSON.stringify({
      shortcode: shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    });
    
    // Instagram's internal GraphQL endpoint
    const graphqlUrl = 'https://www.instagram.com/graphql/query';
    
    const res = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://www.instagram.com/p/${shortcode}/`,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.instagram.com',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: `variables=${encodeURIComponent(variables)}&doc_id=8845758582119845`,
    });

    if (!res.ok) {
      console.log('GraphQL HTTP status:', res.status);
      const text = await res.text();
      console.log('GraphQL response:', text.substring(0, 300));
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    const data = await res.json();
    
    // Navigate the response structure
    const items = data?.data?.xdt_api__v1__media__shortcode__web_info?.items;
    if (!items || items.length === 0) {
      // Try alternate response shape
      const media = data?.data?.xdt_shortcode_media;
      if (media) {
        const likes = media.edge_media_preview_like?.count ?? null;
        const comments = media.edge_media_to_parent_comment?.count ?? media.edge_media_to_comment?.count ?? null;
        const views = media.video_view_count ?? media.video_play_count ?? null;
        const thumbnailUrl = media.display_url ?? media.thumbnail_src ?? null;
        console.log('GraphQL (alt shape) stats:', { views, likes, comments, thumb: !!thumbnailUrl });
        return { views, likes, comments, thumbnailUrl };
      }
      console.log('GraphQL: no items found in response');
      console.log('Response keys:', JSON.stringify(Object.keys(data?.data || {})).substring(0, 200));
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    const item = items[0];
    const likes = item.like_count ?? null;
    const comments = item.comment_count ?? null;
    const views = item.video_view_count ?? item.play_count ?? item.view_count ?? null;
    const thumbnailUrl = item.image_versions2?.candidates?.[0]?.url 
      ?? item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url 
      ?? null;

    console.log('✅ GraphQL stats:', { views, likes, comments, thumb: !!thumbnailUrl });
    return { views, likes, comments, thumbnailUrl };
  } catch (e) {
    console.error('GraphQL error:', e);
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }
}

// Fallback: Scrape the post page for og:image and embedded JSON
async function fetchViaScrape(url: string): Promise<{
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
}> {
  try {
    console.log('Trying scrape fallback for:', url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      console.log('Scrape HTTP:', res.status);
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    const html = await res.text();

    let thumbnailUrl: string | null = null;
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    if (ogMatch) thumbnailUrl = ogMatch[1];

    let views: number | null = null;
    const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/)
      || html.match(/"play_count"\s*:\s*(\d+)/)
      || html.match(/"view_count"\s*:\s*(\d+)/);
    if (viewMatch) views = parseInt(viewMatch[1], 10);

    let likes: number | null = null;
    const likeMatch = html.match(/"like_count"\s*:\s*(\d+)/)
      || html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
    if (likeMatch) likes = parseInt(likeMatch[1], 10);

    let comments: number | null = null;
    const commentMatch = html.match(/"comment_count"\s*:\s*(\d+)/);
    if (commentMatch) comments = parseInt(commentMatch[1], 10);

    console.log('Scrape results:', { views, likes, comments, thumb: !!thumbnailUrl });
    return { views, likes, comments, thumbnailUrl };
  } catch (e) {
    console.error('Scrape error:', e);
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }
}

// Combine methods
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

  console.log('Fetching stats for shortcode:', shortcode);

  // Method 1: GraphQL (works for any public post, no auth)
  const gql = await fetchViaGraphQL(shortcode);
  if (gql.likes !== null || gql.views !== null) {
    return gql;
  }

  // Method 2: Scrape fallback
  const scrape = await fetchViaScrape(url);
  return scrape;
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
          await new Promise(r => setTimeout(r, 1000));
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
