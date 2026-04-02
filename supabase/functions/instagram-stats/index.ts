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

// Convert shortcode to media ID (Instagram uses base64-like encoding)
function shortcodeToMediaId(shortcode: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let id = BigInt(0);
  for (const char of shortcode) {
    id = id * BigInt(64) + BigInt(alphabet.indexOf(char));
  }
  return id.toString();
}

// Method 1: Instagram GraphQL API (real-time accurate data)
async function fetchViaGraphQL(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null;
}> {
  try {
    // Use Instagram's web GraphQL endpoint
    const variables = JSON.stringify({ shortcode, child_comment_count: 0, fetch_comment_count: 0, parent_comment_count: 0, has_threaded_comments: false });
    const docId = '8845758582119845'; // Instagram's public media query doc ID
    const apiUrl = `https://www.instagram.com/graphql/query/?doc_id=${docId}&variables=${encodeURIComponent(variables)}`;
    console.log('Trying GraphQL API for shortcode:', shortcode);
    
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': '*/*',
        'Sec-Fetch-Site': 'same-origin',
      },
    });
    
    if (!res.ok) {
      console.log('GraphQL API HTTP:', res.status);
      // Try alternative doc IDs
      const altDocId = '17991233890457762';
      const altUrl = `https://www.instagram.com/graphql/query/?query_hash=${altDocId}&variables=${encodeURIComponent(JSON.stringify({ shortcode }))}`;
      const altRes = await fetch(altUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-IG-App-ID': '936619743392459',
        },
      });
      if (!altRes.ok) {
        console.log('GraphQL alt HTTP:', altRes.status);
        return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
      }
      const altJson = await altRes.json();
      const altMedia = altJson?.data?.shortcode_media;
      if (altMedia) {
        const views = altMedia.video_view_count ?? altMedia.video_play_count ?? null;
        const likes = altMedia.edge_media_preview_like?.count ?? null;
        const comments = altMedia.edge_media_to_parent_comment?.count ?? null;
        const shares = altMedia.share_count ?? altMedia.reshare_count ?? null;
        console.log('✅ GraphQL alt stats:', { views, likes, comments, shares });
        return { views, likes, comments, shares, thumbnailUrl: altMedia.display_url ?? null };
      }
      return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
    }
    
    const json = await res.json();
    const media = json?.data?.xdt_shortcode_media || json?.data?.shortcode_media;
    if (media) {
      const views = media.video_view_count ?? media.video_play_count ?? media.play_count ?? null;
      const likes = media.edge_media_preview_like?.count ?? media.like_count ?? null;
      const comments = media.edge_media_to_parent_comment?.count ?? media.comment_count ?? null;
      const shares = media.share_count ?? media.reshare_count ?? null;
      const thumbnailUrl = media.display_url ?? null;
      console.log('✅ GraphQL stats:', { views, likes, comments, shares });
      return { views, likes, comments, shares, thumbnailUrl };
    }
    
    console.log('GraphQL: no media in response, keys:', Object.keys(json?.data || {}));
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  } catch (e) {
    console.error('GraphQL error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }
}

// Method 2: Instagram Private Mobile API
async function fetchViaMobileApi(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null;
}> {
  try {
    const mediaId = shortcodeToMediaId(shortcode);
    const apiUrl = `https://i.instagram.com/api/v1/media/${mediaId}/info/`;
    console.log('Trying mobile API, mediaId:', mediaId);
    
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
        'X-IG-App-ID': '567067343352427',
      },
    });
    
    if (!res.ok) {
      console.log('Mobile API HTTP:', res.status);
      return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
    }
    
    const json = await res.json();
    const item = json?.items?.[0];
    if (item) {
      const views = item.play_count ?? item.video_view_count ?? item.view_count ?? null;
      const likes = item.like_count ?? null;
      const comments = item.comment_count ?? null;
      const shares = item.share_count ?? item.reshare_count ?? null;
      const thumbnailUrl = item.image_versions2?.candidates?.[0]?.url ?? null;
      console.log('✅ Mobile API stats:', { views, likes, comments, shares });
      return { views, likes, comments, shares, thumbnailUrl };
    }
    
    console.log('Mobile API: no items');
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  } catch (e) {
    console.error('Mobile API error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }
}

// Method 2: Scrape the main HTML page (often has more current data than embed)
async function fetchViaMainPage(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null;
}> {
  try {
    for (const prefix of ['p', 'reel']) {
      const pageUrl = `https://www.instagram.com/${prefix}/${shortcode}/`;
      console.log('Trying main page:', pageUrl);
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
          'Accept': 'text/html',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      console.log('Main page HTML length:', html.length);

      // Look for JSON data in script tags
      let views: number | null = null;
      let likes: number | null = null;
      let comments: number | null = null;
      let shares: number | null = null;
      let thumbnailUrl: string | null = null;

      // Try to find structured data
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const ld = JSON.parse(jsonLdMatch[1]);
          if (ld.interactionStatistic) {
            for (const stat of (Array.isArray(ld.interactionStatistic) ? ld.interactionStatistic : [ld.interactionStatistic])) {
              if (stat['@type'] === 'InteractionCounter') {
                if (stat.interactionType?.['@type'] === 'WatchAction') {
                  views = parseInt(stat.userInteractionCount, 10);
                } else if (stat.interactionType?.['@type'] === 'LikeAction') {
                  likes = parseInt(stat.userInteractionCount, 10);
                } else if (stat.interactionType?.['@type'] === 'CommentAction') {
                  comments = parseInt(stat.userInteractionCount, 10);
                }
              }
            }
          }
          if (ld.thumbnailUrl) thumbnailUrl = ld.thumbnailUrl;
        } catch {}
      }

      // Fallback: regex patterns on raw HTML/embedded JSON
      if (views === null) {
        const viewPatterns = [
          /video_view_count["\s:]+(\d+)/,
          /video_play_count["\s:]+(\d+)/,
          /play_count["\s:]+(\d+)/,
          /"view_count"\s*:\s*(\d+)/,
        ];
        for (const p of viewPatterns) {
          const m = html.match(p);
          if (m) { views = parseInt(m[1], 10); break; }
        }
      }
      if (likes === null) {
        const likePatterns = [/likes_count["\s:]+(\d+)/, /like_count["\s:]+(\d+)/, /edge_liked_by[^}]*count["\s:]+(\d+)/];
        for (const p of likePatterns) {
          const m = html.match(p);
          if (m) { likes = parseInt(m[1], 10); break; }
        }
      }
      if (comments === null) {
        const commentPatterns = [/comment_count["\s:]+(\d+)/, /commenter_count["\s:]+(\d+)/];
        for (const p of commentPatterns) {
          const m = html.match(p);
          if (m) { comments = parseInt(m[1], 10); break; }
        }
      }

      // Try to extract share count
      if (shares === null) {
        const sharePatterns = [/share_count["\s:]+(\d+)/, /reshare_count["\s:]+(\d+)/];
        for (const p of sharePatterns) {
          const m = html.match(p);
          if (m) { shares = parseInt(m[1], 10); break; }
        }
      }

      if (views !== null || likes !== null) {
        console.log('✅ Main page stats:', { views, likes, comments, shares, prefix });
        return { views, likes, comments, shares, thumbnailUrl };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  } catch (e) {
    console.error('Main page error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }
}

// Method 3: Embed page (fallback - can have stale view counts)
async function fetchViaEmbed(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null;
}> {
  try {
    for (const prefix of ['p', 'reel']) {
      const embedUrl = `https://www.instagram.com/${prefix}/${shortcode}/embed/captioned/`;
      console.log('Trying embed:', embedUrl);
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
          'Accept': 'text/html',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      console.log('Embed HTML length:', html.length);

      let likes: number | null = null;
      for (const p of [/likes_count[^\d]{0,5}(\d+)/, /edge_liked_by[^\d]{0,15}(\d+)/, /like_count[^\d]{0,5}(\d+)/]) {
        const m = html.match(p);
        if (m) { likes = parseInt(m[1].replace(/,/g, ''), 10); break; }
      }

      let views: number | null = null;
      for (const p of [/video_view_count[^\d]{0,5}(\d+)/, /video_play_count[^\d]{0,5}(\d+)/, /play_count[^\d]{0,5}(\d+)/]) {
        const m = html.match(p);
        if (m) { views = parseInt(m[1].replace(/,/g, ''), 10); break; }
      }

      let comments: number | null = null;
      for (const p of [/commenter_count[^\d]{0,5}(\d+)/, /comment_count[^\d]{0,5}(\d+)/]) {
        const m = html.match(p);
        if (m) { comments = parseInt(m[1].replace(/,/g, ''), 10); break; }
      }

      let thumbnailUrl: string | null = null;
      const displayMatch = html.match(/"display_url"\s*:\s*"([^"]+)"/);
      if (displayMatch) thumbnailUrl = displayMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      if (!thumbnailUrl) {
        const thumbMatch = html.match(/"thumbnail_src"\s*:\s*"([^"]+)"/);
        if (thumbMatch) thumbnailUrl = thumbMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      }

      let shares: number | null = null;
      for (const p of [/share_count[^\d]{0,5}(\d+)/, /reshare_count[^\d]{0,5}(\d+)/]) {
        const m = html.match(p);
        if (m) { shares = parseInt(m[1].replace(/,/g, ''), 10); break; }
      }

      if (likes !== null || views !== null) {
        console.log('✅ Embed stats:', { views, likes, comments, shares });
        return { views, likes, comments, shares, thumbnailUrl };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  } catch (e) {
    console.error('Embed error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }
}

// Combine results from multiple methods, taking the highest values (real counts only go up)
function mergeStats(...results: Array<{ views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null }>) {
  let views: number | null = null;
  let likes: number | null = null;
  let comments: number | null = null;
  let shares: number | null = null;
  let thumbnailUrl: string | null = null;

  for (const r of results) {
    if (r.views !== null && (views === null || r.views > views)) views = r.views;
    if (r.likes !== null && (likes === null || r.likes > likes)) likes = r.likes;
    if (r.comments !== null && (comments === null || r.comments > comments)) comments = r.comments;
    if (r.shares !== null && (shares === null || r.shares > shares)) shares = r.shares;
    if (r.thumbnailUrl && !thumbnailUrl) thumbnailUrl = r.thumbnailUrl;
  }

  return { views, likes, comments, shares, thumbnailUrl };
}

async function fetchInstagramPostStats(url: string) {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    console.log('Could not extract shortcode from:', url);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }

  // Try all methods in parallel for speed and accuracy
  const [gqlResult, mobileResult, mainResult, embedResult] = await Promise.all([
    fetchViaGraphQL(shortcode),
    fetchViaMobileApi(shortcode),
    fetchViaMainPage(shortcode),
    fetchViaEmbed(shortcode),
  ]);

  const merged = mergeStats(gqlResult, mobileResult, mainResult, embedResult);
  console.log('🔥 Final merged stats:', merged);
  return merged;
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
        .select('id, campaign_id, video_url, view_count, like_count, comment_count, share_count, thumbnail_url')
        .or('platform.eq.instagram,video_url.ilike.%instagram.com%')
        .limit(100);

      if (error) throw error;

      let updated = 0;
      for (const edit of (edits || [])) {
        if (!edit.video_url) continue;
        try {
          const stats = await fetchInstagramPostStats(edit.video_url);
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };
          
          // Only update if scraped value is HIGHER than current (views only go up)
          if (stats.views !== null && stats.views > (edit.view_count || 0)) payload.view_count = stats.views;
          if (stats.likes !== null && stats.likes > (edit.like_count || 0)) payload.like_count = stats.likes;
          if (stats.comments !== null && stats.comments > (edit.comment_count || 0)) payload.comment_count = stats.comments;
          if (stats.shares !== null && stats.shares > (edit.share_count || 0)) payload.share_count = stats.shares;
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

      // NOW aggregate edit metrics up to each campaign
      const campaignIds = [...new Set((edits || []).map(e => e.campaign_id).filter(Boolean))];
      for (const cid of campaignIds) {
        try {
          // Get ALL edits for this campaign (not just IG ones)
          const { data: allEdits } = await supabase
            .from('artist_campaign_edits')
            .select('view_count, like_count, comment_count, share_count')
            .eq('campaign_id', cid);

          if (allEdits && allEdits.length > 0) {
            const totalViews = allEdits.reduce((s, e) => s + (e.view_count || 0), 0);
            const totalEngagements = allEdits.reduce((s, e) => s + (e.like_count || 0) + (e.comment_count || 0) + (e.share_count || 0), 0);

            // Only update campaign if aggregated is higher
            const { data: campaign } = await supabase
              .from('artist_campaigns')
              .select('total_views, total_engagements')
              .eq('id', cid)
              .single();

            const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
            if (totalViews > (campaign?.total_views || 0)) updatePayload.total_views = totalViews;
            if (totalEngagements > (campaign?.total_engagements || 0)) updatePayload.total_engagements = totalEngagements;

            if (Object.keys(updatePayload).length > 1) {
              await supabase.from('artist_campaigns').update(updatePayload).eq('id', cid);
              console.log(`📊 Updated campaign ${cid}: views=${totalViews}, engagements=${totalEngagements}`);
            }
          }
        } catch (e) {
          console.error(`Error aggregating campaign ${cid}:`, e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, processed: edits?.length || 0, updated, campaigns_updated: campaignIds.length }),
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
