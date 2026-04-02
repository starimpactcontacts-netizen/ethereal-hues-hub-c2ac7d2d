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

async function getIGAccount(userToken: string): Promise<{ pageToken: string; igUserId: string } | null> {
  try {
    // Step 1: Get pages (without instagram_business_account in fields)
    const pagesRes = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`);
    const pagesData = await pagesRes.json();
    
    if (pagesData.error) {
      console.error('FB /me/accounts error:', JSON.stringify(pagesData.error));
      return null;
    }

    const pages = pagesData.data || [];
    console.log('Pages found:', pages.length, pages.map((p: any) => p.name));

    if (pages.length === 0) {
      // Maybe the token IS a page token already - try using it directly
      console.log('No pages found, trying token as page token directly...');
      const meRes = await fetch(`${FB_API}/me?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`);
      const meData = await meRes.json();
      console.log('Direct /me result:', JSON.stringify(meData));
      
      if (meData.instagram_business_account?.id) {
        return { pageToken: userToken, igUserId: meData.instagram_business_account.id };
      }
      
      // Last resort: try as IG user token directly
      const igMeRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(userToken)}`);
      const igMeData = await igMeRes.json();
      console.log('IG /me result:', JSON.stringify(igMeData));
      
      if (igMeData.id) {
        return { pageToken: userToken, igUserId: igMeData.id };
      }
      
      return null;
    }

    // Step 2: For each page, check if it has an instagram_business_account
    for (const page of pages) {
      try {
        const igRes = await fetch(
          `${FB_API}/${page.id}?fields=instagram_business_account{id,username},name&access_token=${encodeURIComponent(page.access_token)}`
        );
        const igData = await igRes.json();
        console.log(`Page "${page.name}" IG account:`, JSON.stringify(igData.instagram_business_account));
        
        if (igData.instagram_business_account?.id) {
          return {
            pageToken: page.access_token,
            igUserId: igData.instagram_business_account.id,
          };
        }
      } catch (e) {
        console.error(`Error checking page ${page.id}:`, e);
      }
    }

    console.error('No page has an instagram_business_account linked');
    return null;
  } catch (e) {
    console.error('getIGAccount error:', e);
    return null;
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

  const account = await getIGAccount(userToken);
  if (!account) {
    console.error('Could not resolve IG account');
    return { views: null, likes: null, comments: null, thumbnailUrl: null };
  }

  const { pageToken, igUserId } = account;
  console.log('Got IG user ID:', igUserId);

  try {
    // Fetch media - paginate to find the post
    let allMedia: any[] = [];
    let nextUrl: string | null = `${FB_API}/${igUserId}/media?fields=id,shortcode,permalink,media_type,thumbnail_url,like_count,comments_count,timestamp&limit=50&access_token=${encodeURIComponent(pageToken)}`;
    
    for (let page = 0; page < 4 && nextUrl; page++) {
      const mediaRes = await fetch(nextUrl);
      if (!mediaRes.ok) {
        const errText = await mediaRes.text();
        console.error('IG media list error:', errText);
        break;
      }
      const mediaData = await mediaRes.json();
      allMedia = allMedia.concat(mediaData.data || []);
      
      const found = allMedia.find((m: any) => m.shortcode === shortcode || m.permalink?.includes(shortcode));
      if (found) break;
      
      nextUrl = mediaData.paging?.next || null;
    }

    const match = allMedia.find((m: any) => m.shortcode === shortcode || m.permalink?.includes(shortcode));

    if (!match) {
      console.log('No matching media for shortcode:', shortcode, '(searched', allMedia.length, 'posts)');
      return { views: null, likes: null, comments: null, thumbnailUrl: null };
    }

    console.log('Found media:', match.id, 'type:', match.media_type);

    // Get insights for video content
    let views: number | null = null;
    if (match.media_type === 'VIDEO') {
      // Try multiple insight metric sets since available metrics vary
      const metricSets = [
        'plays,reach',
        'ig_reels_aggregated_all_plays_count',
        'reach,saved,shares',
      ];
      
      for (const metrics of metricSets) {
        try {
          const insightsRes = await fetch(
            `${FB_API}/${match.id}/insights?metric=${metrics}&access_token=${encodeURIComponent(pageToken)}`
          );
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json();
            for (const metric of (insightsData.data || [])) {
              if (['plays', 'views', 'ig_reels_aggregated_all_plays_count'].includes(metric.name) && metric.values?.[0]?.value) {
                views = metric.values[0].value;
                console.log(`Got views from ${metric.name}:`, views);
              }
            }
            if (views !== null) break;
          } else {
            const errText = await insightsRes.text();
            console.log(`Insights metrics "${metrics}" failed:`, errText.substring(0, 200));
          }
        } catch (e) {
          console.error('Insights error:', e);
        }
      }
    }

    return {
      views,
      likes: match.like_count ?? null,
      comments: match.comments_count ?? null,
      thumbnailUrl: match.thumbnail_url || null,
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
