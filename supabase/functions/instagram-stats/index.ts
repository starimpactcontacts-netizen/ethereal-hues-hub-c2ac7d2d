import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FB_API = 'https://graph.facebook.com/v21.0';

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// Method 1: Try Facebook Graph API (Page token flow)
async function tryGraphAPI(shortcode: string, userToken: string) {
  try {
    // Get pages
    const pagesRes = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) {
      console.log('Graph API pages error:', pagesData.error.message);
      return null;
    }
    
    const pages = pagesData.data || [];
    console.log('Graph API pages:', pages.length);
    if (pages.length === 0) return null;

    for (const page of pages) {
      const igRes = await fetch(`${FB_API}/${page.id}?fields=instagram_business_account{id}&access_token=${encodeURIComponent(page.access_token)}`);
      const igData = await igRes.json();
      if (!igData.instagram_business_account?.id) continue;

      const igUserId = igData.instagram_business_account.id;
      const pageToken = page.access_token;

      // Search media
      let nextUrl: string | null = `${FB_API}/${igUserId}/media?fields=id,shortcode,permalink,media_type,thumbnail_url,like_count,comments_count&limit=50&access_token=${encodeURIComponent(pageToken)}`;
      
      for (let p = 0; p < 4 && nextUrl; p++) {
        const mediaRes = await fetch(nextUrl);
        if (!mediaRes.ok) break;
        const mediaData = await mediaRes.json();
        
        const match = (mediaData.data || []).find((m: any) => m.shortcode === shortcode || m.permalink?.includes(shortcode));
        if (match) {
          let views: number | null = null;
          if (match.media_type === 'VIDEO') {
            for (const metrics of ['plays', 'ig_reels_aggregated_all_plays_count']) {
              try {
                const iRes = await fetch(`${FB_API}/${match.id}/insights?metric=${metrics}&access_token=${encodeURIComponent(pageToken)}`);
                if (iRes.ok) {
                  const iData = await iRes.json();
                  for (const m of (iData.data || [])) {
                    if (m.values?.[0]?.value) views = m.values[0].value;
                  }
                  if (views) break;
                }
              } catch {}
            }
          }
          return { views, likes: match.like_count ?? null, comments: match.comments_count ?? null, thumbnailUrl: match.thumbnail_url || null };
        }
        
        nextUrl = mediaData.paging?.next || null;
      }
    }
  } catch (e) {
    console.error('Graph API error:', e);
  }
  return null;
}

// Method 2: oEmbed for thumbnail
async function tryOEmbed(url: string, accessToken: string): Promise<string | null> {
  try {
    const oembedUrl = `${FB_API}/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return data.thumbnail_url || null;
    }
    const errText = await res.text();
    console.log('oEmbed error:', errText.substring(0, 200));
  } catch (e) {
    console.error('oEmbed error:', e);
  }
  return null;
}

// Method 3: Scrape Instagram page for metadata
async function tryScrape(url: string): Promise<{ thumbnailUrl: string | null; views: number | null; likes: number | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!res.ok) {
      console.log('Scrape HTTP status:', res.status);
      return { thumbnailUrl: null, views: null, likes: null };
    }
    
    const html = await res.text();
    
    // Extract og:image for thumbnail
    let thumbnailUrl: string | null = null;
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) 
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);
    if (ogMatch) {
      thumbnailUrl = ogMatch[1];
    }
    
    // Try to extract view count from meta or JSON-LD
    let views: number | null = null;
    const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/) 
      || html.match(/"view_count"\s*:\s*(\d+)/)
      || html.match(/interactionCount['"]\s*:\s*['"]*(\d+)/);
    if (viewMatch) {
      views = parseInt(viewMatch[1], 10);
    }
    
    // Try to extract like count
    let likes: number | null = null;
    const likeMatch = html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/)
      || html.match(/"like_count"\s*:\s*(\d+)/);
    if (likeMatch) {
      likes = parseInt(likeMatch[1], 10);
    }
    
    console.log('Scrape results - thumb:', !!thumbnailUrl, 'views:', views, 'likes:', likes);
    return { thumbnailUrl, views, likes };
  } catch (e) {
    console.error('Scrape error:', e);
    return { thumbnailUrl: null, views: null, likes: null };
  }
}

async function fetchInstagramPostStats(url: string, userToken: string): Promise<{
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

  console.log('Looking up shortcode:', shortcode);

  // Try Method 1: Graph API (best data)
  const graphResult = await tryGraphAPI(shortcode, userToken);
  if (graphResult && (graphResult.views !== null || graphResult.likes !== null)) {
    console.log('✅ Graph API succeeded');
    return graphResult;
  }

  // Try Method 2 + 3: oEmbed thumbnail + scrape for stats
  console.log('Graph API unavailable, falling back to oEmbed + scrape');
  
  const [oembedThumb, scrapeResult] = await Promise.all([
    tryOEmbed(url, userToken),
    tryScrape(url),
  ]);

  return {
    views: scrapeResult.views,
    likes: scrapeResult.likes,
    comments: null,
    thumbnailUrl: oembedThumb || scrapeResult.thumbnailUrl,
  };
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

    if (action === 'get-stats' && url) {
      const stats = await fetchInstagramPostStats(url, accessToken);
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
          const stats = await fetchInstagramPostStats(edit.video_url, accessToken);
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };
          if (stats.views !== null) payload.view_count = stats.views;
          if (stats.likes !== null) payload.like_count = stats.likes;
          if (stats.comments !== null) payload.comment_count = stats.comments;
          if (stats.thumbnailUrl && !edit.thumbnail_url) payload.thumbnail_url = stats.thumbnailUrl;

          if (Object.keys(payload).length > 1) {
            await supabase.from('artist_campaign_edits').update(payload).eq('id', edit.id);
            updated++;
          }
          await new Promise(r => setTimeout(r, 500));
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
