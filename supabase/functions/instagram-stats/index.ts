import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FB_API = 'https://graph.facebook.com/v23.0';

// Extract Instagram media shortcode from URL
function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// Step 1: Get the Facebook Page ID + its access token
async function getPageToken(userAccessToken: string): Promise<{ pageId: string; pageToken: string; igUserId: string } | null> {
  try {
    // Get pages the user manages
    const pagesUrl = `${FB_API}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userAccessToken)}`;
    console.log('Fetching pages from:', pagesUrl.substring(0, 80) + '...');
    const pagesRes = await fetch(pagesUrl);
    if (!pagesRes.ok) {
      const err = await pagesRes.text();
      console.error('FB /me/accounts error:', err);
      return null;
    }
    const pagesData = await pagesRes.json();
    console.log('Pages found:', pagesData.data?.length || 0);
    console.log('Pages detail:', JSON.stringify((pagesData.data || []).map((p: any) => ({ id: p.id, name: p.name, ig: p.instagram_business_account }))));

    // Find first page with an instagram_business_account
    for (const page of (pagesData.data || [])) {
      if (page.instagram_business_account?.id) {
        console.log(`Found IG business account ${page.instagram_business_account.id} on page ${page.name}`);
        return {
          pageId: page.id,
          pageToken: page.access_token,
          igUserId: page.instagram_business_account.id,
        };
      }
    }

    // If instagram_business_account wasn't in the fields, query each page
    for (const page of (pagesData.data || [])) {
      try {
        const igRes = await fetch(`${FB_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
        if (igRes.ok) {
          const igData = await igRes.json();
          if (igData.instagram_business_account?.id) {
            console.log(`Found IG business account ${igData.instagram_business_account.id} on page ${page.name}`);
            return {
              pageId: page.id,
              pageToken: page.access_token,
              igUserId: igData.instagram_business_account.id,
            };
          }
        }
      } catch (e) {
        console.error(`Error checking page ${page.id}:`, e);
      }
    }

    console.error('No page with instagram_business_account found');
    return null;
  } catch (e) {
    console.error('getPageToken error:', e);
    return null;
  }
}

// Step 2: Find media by shortcode and get stats
async function fetchInstagramPostStats(url: string, userAccessToken: string): Promise<{
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

  const pageInfo = await getPageToken(userAccessToken);
  if (!pageInfo) {
    console.error('Could not get page token / IG user ID');
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }

  const { pageToken, igUserId } = pageInfo;

  try {
    // Fetch recent media from the IG business account
    let allMedia: any[] = [];
    let mediaUrl = `${FB_API}/${igUserId}/media?fields=id,shortcode,permalink,media_type,thumbnail_url,like_count,comments_count,timestamp&limit=50&access_token=${pageToken}`;
    
    // Paginate up to 200 posts to find the match
    for (let page = 0; page < 4; page++) {
      const mediaRes = await fetch(mediaUrl);
      if (!mediaRes.ok) {
        const errText = await mediaRes.text();
        console.error('IG media list error:', errText);
        break;
      }
      const mediaData = await mediaRes.json();
      allMedia = allMedia.concat(mediaData.data || []);
      
      // Check if we found it
      const found = allMedia.find((m: any) => 
        m.shortcode === shortcode || m.permalink?.includes(shortcode)
      );
      if (found) break;
      
      // Next page
      if (mediaData.paging?.next) {
        mediaUrl = mediaData.paging.next;
      } else {
        break;
      }
    }

    const matchingMedia = allMedia.find((m: any) =>
      m.shortcode === shortcode || m.permalink?.includes(shortcode)
    );

    if (!matchingMedia) {
      console.log('No matching media found for shortcode:', shortcode, '(searched', allMedia.length, 'posts)');
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    console.log('Found media:', matchingMedia.id, 'type:', matchingMedia.media_type);

    // Get insights for videos/reels
    let views: number | null = null;
    if (matchingMedia.media_type === 'VIDEO') {
      try {
        const insightsRes = await fetch(
          `${FB_API}/${matchingMedia.id}/insights?metric=plays,reach,total_interactions,likes,comments,shares,saved&access_token=${pageToken}`
        );
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          console.log('Insights data:', JSON.stringify(insightsData.data?.map((d: any) => ({ name: d.name, value: d.values?.[0]?.value }))));
          for (const metric of (insightsData.data || [])) {
            if (metric.name === 'plays' || metric.name === 'views') {
              views = metric.values?.[0]?.value || null;
            }
          }
        } else {
          const errText = await insightsRes.text();
          console.error('Insights error:', errText);
          
          // Fallback: try ig_reels_aggregated_all_plays_count
          const fallbackRes = await fetch(
            `${FB_API}/${matchingMedia.id}/insights?metric=ig_reels_aggregated_all_plays_count&access_token=${pageToken}`
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            for (const metric of (fallbackData.data || [])) {
              if (metric.name === 'ig_reels_aggregated_all_plays_count') {
                views = metric.values?.[0]?.value || null;
              }
            }
          }
        }
      } catch (e) {
        console.error('Insights fetch error:', e);
      }
    }

    return {
      views,
      likes: matchingMedia.like_count ?? null,
      comments: matchingMedia.comments_count ?? null,
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
