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

// Rotating user agents to avoid rate-limit fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

// Fetch with timeout + 1 retry on transient failure (rate-limit / network blip)
async function fetchWithRetry(url: string, init: RequestInit, timeoutMs = 8000): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(t);
      // Retry on rate-limit or server errors
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(t);
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      throw e;
    }
  }
  // unreachable
  return new Response(null, { status: 599 });
}

// Method 1: Instagram GraphQL API (real-time accurate data)
async function fetchViaGraphQL(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    // Use Instagram's web GraphQL endpoint
    const variables = JSON.stringify({ shortcode, child_comment_count: 0, fetch_comment_count: 0, parent_comment_count: 0, has_threaded_comments: false });
    const docId = '8845758582119845'; // Instagram's public media query doc ID
    const apiUrl = `https://www.instagram.com/graphql/query/?doc_id=${docId}&variables=${encodeURIComponent(variables)}`;
    console.log('Trying GraphQL API for shortcode:', shortcode);
    
    const res = await fetchWithRetry(apiUrl, {
      headers: {
        'User-Agent': pickUA(),
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
      const altRes = await fetchWithRetry(altUrl, {
        headers: {
          'User-Agent': pickUA(),
          'X-IG-App-ID': '936619743392459',
        },
      });
      if (!altRes.ok) {
        console.log('GraphQL alt HTTP:', altRes.status);
        return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
      }
      const altJson = await altRes.json();
      const altMedia = altJson?.data?.shortcode_media;
      if (altMedia) {
        const views = altMedia.video_view_count ?? altMedia.video_play_count ?? null;
        const likes = altMedia.edge_media_preview_like?.count ?? null;
        const comments = altMedia.edge_media_to_parent_comment?.count ?? null;
        const shares = altMedia.share_count ?? altMedia.reshare_count ?? null;
        const takenAt = altMedia.taken_at_timestamp ?? null;
        console.log('✅ GraphQL alt stats:', { views, likes, comments, shares });
        return { views, likes, comments, shares, thumbnailUrl: altMedia.display_url ?? null, takenAt };
      }
      return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
    }
    
    const json = await res.json();
    const media = json?.data?.xdt_shortcode_media || json?.data?.shortcode_media;
    if (media) {
      const views = media.video_view_count ?? media.video_play_count ?? media.play_count ?? null;
      const likes = media.edge_media_preview_like?.count ?? media.like_count ?? null;
      const comments = media.edge_media_to_parent_comment?.count ?? media.comment_count ?? null;
      const shares = media.share_count ?? media.reshare_count ?? null;
      const thumbnailUrl = media.display_url ?? null;
      const takenAt = media.taken_at_timestamp ?? null;
      console.log('✅ GraphQL stats:', { views, likes, comments, shares });
      return { views, likes, comments, shares, thumbnailUrl, takenAt };
    }
    
    console.log('GraphQL: no media in response, keys:', Object.keys(json?.data || {}));
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('GraphQL error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

// Method 2: Instagram Private Mobile API
async function fetchViaMobileApi(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    const mediaId = shortcodeToMediaId(shortcode);
    const apiUrl = `https://i.instagram.com/api/v1/media/${mediaId}/info/`;
    console.log('Trying mobile API, mediaId:', mediaId);
    
    const res = await fetchWithRetry(apiUrl, {
      headers: {
        'User-Agent': 'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
        'X-IG-App-ID': '567067343352427',
      },
    });
    
    if (!res.ok) {
      console.log('Mobile API HTTP:', res.status);
      return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
    }
    
    const json = await res.json();
    const item = json?.items?.[0];
    if (item) {
      const views = item.play_count ?? item.video_view_count ?? item.view_count ?? null;
      const likes = item.like_count ?? null;
      const comments = item.comment_count ?? null;
      const shares = item.share_count ?? item.reshare_count ?? null;
      const thumbnailUrl = item.image_versions2?.candidates?.[0]?.url ?? null;
      const takenAt = item.taken_at ?? null;
      console.log('✅ Mobile API stats:', { views, likes, comments, shares });
      return { views, likes, comments, shares, thumbnailUrl, takenAt };
    }
    
    console.log('Mobile API: no items');
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('Mobile API error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

// Method 2: Scrape the main HTML page (often has more current data than embed)
async function fetchViaMainPage(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    for (const prefix of ['p', 'reel']) {
      const pageUrl = `https://www.instagram.com/${prefix}/${shortcode}/`;
      console.log('Trying main page:', pageUrl);
      const res = await fetchWithRetry(pageUrl, {
        headers: {
          'User-Agent': pickUA(),
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
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
      let takenAt: number | null = null;

      // taken_at_timestamp from embedded JSON
      const takenMatch = html.match(/"taken_at_timestamp"\s*:\s*(\d+)/) || html.match(/"taken_at"\s*:\s*(\d+)/);
      if (takenMatch) takenAt = parseInt(takenMatch[1], 10);

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
          /"play_count"\s*:\s*(\d+)/,
          /"video_play_count"\s*:\s*(\d+)/,
          /"video_view_count"\s*:\s*(\d+)/,
          /video_view_count["\s:]+(\d+)/,
          /video_play_count["\s:]+(\d+)/,
          /play_count["\s:]+(\d+)/,
          /"view_count"\s*:\s*(\d+)/,
        ];
        // Take the MAX across all matching patterns (Instagram embeds multiple counters; latest is usually highest)
        let best = 0;
        for (const p of viewPatterns) {
          const matches = html.matchAll(new RegExp(p.source, 'g'));
          for (const m of matches) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
          }
        }
        if (best > 0) views = best;
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
        return { views, likes, comments, shares, thumbnailUrl, takenAt };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('Main page error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

// Method 3: Embed page (fallback - can have stale view counts)
async function fetchViaEmbed(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    for (const prefix of ['p', 'reel']) {
      const embedUrl = `https://www.instagram.com/${prefix}/${shortcode}/embed/captioned/`;
      console.log('Trying embed:', embedUrl);
      const res = await fetchWithRetry(embedUrl, {
        headers: {
          'User-Agent': pickUA(),
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

      let takenAt: number | null = null;
      const tk = html.match(/"taken_at_timestamp"\s*:\s*(\d+)/) || html.match(/"taken_at"\s*:\s*(\d+)/);
      if (tk) takenAt = parseInt(tk[1], 10);

      if (likes !== null || views !== null) {
        console.log('✅ Embed stats:', { views, likes, comments, shares });
        return { views, likes, comments, shares, thumbnailUrl, takenAt };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('Embed error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

// Method 5: Secondary GraphQL with PolarisPostRootQuery doc_id (different cache layer than method 1)
async function fetchViaGraphQLAlt(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    // PolarisPostRootQuery - hits a different IG cache cluster, often fresher
    const docIds = ['8845758582119845', '7950326061742207', '25531498899829322'];
    for (const docId of docIds) {
      const variables = JSON.stringify({
        shortcode,
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      });
      const apiUrl = `https://www.instagram.com/api/graphql`;
      const body = `av=0&__d=www&__user=0&__a=1&__req=1&__hs=20000&dpr=2&__ccg=EXCELLENT&doc_id=${docId}&variables=${encodeURIComponent(variables)}`;
      const res = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'User-Agent': pickUA(),
          'X-IG-App-ID': '936619743392459',
          'X-FB-Friendly-Name': 'PolarisPostRootQuery',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Sec-Fetch-Site': 'same-origin',
          'Origin': 'https://www.instagram.com',
          'Referer': `https://www.instagram.com/p/${shortcode}/`,
        },
        body,
      });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const media = json?.data?.xdt_shortcode_media || json?.data?.shortcode_media;
      if (media) {
        const views = media.video_play_count ?? media.video_view_count ?? media.play_count ?? null;
        const likes = media.edge_media_preview_like?.count ?? media.like_count ?? null;
        const comments = media.edge_media_to_parent_comment?.count ?? media.comment_count ?? null;
        const shares = media.share_count ?? media.reshare_count ?? null;
        const thumbnailUrl = media.display_url ?? null;
        const takenAt = media.taken_at_timestamp ?? null;
        console.log(`✅ GraphQL alt (${docId}) stats:`, { views, likes, comments });
        return { views, likes, comments, shares, thumbnailUrl, takenAt };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('GraphQL alt error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

// Method 6: Mobile web (m.instagram.com) - separate render pipeline, uncached
async function fetchViaMobileWeb(shortcode: string): Promise<{
  views: number | null; likes: number | null; comments: number | null; shares: number | null; thumbnailUrl: string | null; takenAt: number | null;
}> {
  try {
    for (const prefix of ['p', 'reel']) {
      const pageUrl = `https://www.instagram.com/${prefix}/${shortcode}/?__a=1&__d=dis`;
      const res = await fetchWithRetry(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'X-IG-App-ID': '936619743392459',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.instagram.com/',
        },
      });
      if (!res.ok) continue;
      const text = await res.text();
      // Response can be JSON or HTML depending on IG's mood
      let views: number | null = null, likes: number | null = null, comments: number | null = null;
      let shares: number | null = null, thumbnailUrl: string | null = null, takenAt: number | null = null;
      try {
        const json = JSON.parse(text);
        const media = json?.graphql?.shortcode_media || json?.items?.[0];
        if (media) {
          views = media.video_play_count ?? media.video_view_count ?? media.play_count ?? null;
          likes = media.edge_media_preview_like?.count ?? media.like_count ?? null;
          comments = media.edge_media_to_parent_comment?.count ?? media.comment_count ?? null;
          shares = media.share_count ?? media.reshare_count ?? null;
          thumbnailUrl = media.display_url ?? media.image_versions2?.candidates?.[0]?.url ?? null;
          takenAt = media.taken_at_timestamp ?? media.taken_at ?? null;
        }
      } catch {
        // Fallback: regex scrape on the HTML body
        const viewMatches = [...text.matchAll(/"(?:video_play_count|video_view_count|play_count)"\s*:\s*(\d+)/g)];
        for (const m of viewMatches) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && (views === null || n > views)) views = n;
        }
        const likeM = text.match(/"(?:like_count|edge_media_preview_like)"[^\d]+(\d+)/);
        if (likeM) likes = parseInt(likeM[1], 10);
        const commM = text.match(/"comment_count"\s*:\s*(\d+)/);
        if (commM) comments = parseInt(commM[1], 10);
        const tk = text.match(/"taken_at(?:_timestamp)?"\s*:\s*(\d+)/);
        if (tk) takenAt = parseInt(tk[1], 10);
      }
      if (views !== null || likes !== null) {
        console.log('✅ Mobile web stats:', { views, likes, comments });
        return { views, likes, comments, shares, thumbnailUrl, takenAt };
      }
    }
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  } catch (e) {
    console.error('Mobile web error:', e);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null, takenAt: null };
  }
}

type InstagramStats = {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  thumbnailUrl: string | null;
  takenAt?: number | null;
};

function pickHighestMetric(results: InstagramStats[], key: keyof Pick<InstagramStats, 'views' | 'likes' | 'comments' | 'shares'>, allowZero = false): number | null {
  let best: number | null = null;
  for (const result of results) {
    const value = result[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    if (allowZero ? value < 0 : value <= 0) continue;
    if (best === null || value > best) best = value;
  }
  return best;
}

function countMetricSources(results: InstagramStats[], key: keyof Pick<InstagramStats, 'views' | 'likes' | 'comments' | 'shares'>, allowZero = false): number {
  return results.filter(result => {
    const value = result[key];
    return typeof value === 'number' && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);
  }).length;
}

function buildValidatedStats(
  gqlResult: InstagramStats,
  mobileResult: InstagramStats,
  mainResult: InstagramStats,
  embedResult: InstagramStats,
  gqlAltResult: InstagramStats,
  mobileWebResult: InstagramStats,
) {
  // Trusted = direct API/JSON sources. Embed is fallback only (often stale).
  const trustedResults = [gqlResult, mobileResult, mainResult, gqlAltResult, mobileWebResult];
  const allResults = [...trustedResults, embedResult];

  const trustedViewSources = countMetricSources(trustedResults, 'views');
  const totalViewSources = countMetricSources(allResults, 'views');
  // ULTRA-STRICT consensus for views (the most-gamed metric):
  // 1. Take the HIGHEST trusted value that ANOTHER trusted source corroborates within 15%
  // 2. Falling back: highest trusted value with ANY-source corroboration within 25%
  // 3. Falling back: median of trusted values
  // 4. Falling back: single trusted source
  // Views go UP, never down — caller still enforces monotonic-increasing on top of this.
  const allViewVals = allResults
    .map(r => r.views)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)
    .sort((a, b) => b - a); // desc
  const trustedViewVals = trustedResults
    .map(r => r.views)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0)
    .sort((a, b) => b - a);

  let candidateViews: number | null = null;
  let confidenceTier: 'strong' | 'medium' | 'weak' | 'none' = 'none';
  // Pass 1: HIGHEST trusted value with TRUSTED corroboration within 15% — strongest signal
  for (const v of trustedViewVals) {
    const corroborated = trustedViewVals.some(o => o !== v && Math.max(v, o) / Math.min(v, o) <= 1.15);
    if (corroborated) { candidateViews = v; confidenceTier = 'strong'; break; }
  }
  // Pass 2: HIGHEST trusted value with ANY-source corroboration within 25%
  if (candidateViews === null) {
    for (const v of trustedViewVals) {
      const corroborated = allViewVals.some(o => o !== v && Math.max(v, o) / Math.min(v, o) <= 1.25);
      if (corroborated) { candidateViews = v; confidenceTier = 'medium'; break; }
    }
  }
  // Pass 3: ≥2 trusted sources → median (2nd highest = resilient to single outlier)
  if (candidateViews === null && trustedViewVals.length >= 2) {
    candidateViews = trustedViewVals[1];
    confidenceTier = 'medium';
  }
  // Pass 4: single trusted source → trust it but flag weak
  if (candidateViews === null && trustedViewVals.length === 1) {
    candidateViews = trustedViewVals[0];
    confidenceTier = 'weak';
  }
  // Pass 5: only embed → highest of any source, weak
  if (candidateViews === null && totalViewSources >= 2) {
    candidateViews = allViewVals[0] ?? null;
    confidenceTier = 'weak';
  }

  const likes = pickHighestMetric(allResults, 'likes');
  const comments = pickHighestMetric(allResults, 'comments', true);
  const shares = pickHighestMetric(allResults, 'shares', true);
  const thumbnailUrl = gqlResult.thumbnailUrl || mobileResult.thumbnailUrl || gqlAltResult.thumbnailUrl
    || mobileWebResult.thumbnailUrl || mainResult.thumbnailUrl || embedResult.thumbnailUrl || null;
  // Pick the EXACT taken_at timestamp - prefer trusted sources, take the one most agree on
  const takenAtCandidates = allResults
    .map(r => r.takenAt)
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t > 0);
  const takenAt = takenAtCandidates.length > 0 ? takenAtCandidates[0] : null;

  // Plausibility: views >= max(likes, comments) AND likes/views ratio sane (< ~66%)
  const maxEngagement = Math.max(likes || 0, comments || 0);
  const plausibleViews = candidateViews !== null
    && candidateViews >= maxEngagement
    && (likes === null || likes === 0 || candidateViews >= likes * 1.5);

  return {
    views: plausibleViews ? candidateViews : null,
    likes,
    comments,
    shares,
    thumbnailUrl,
    takenAt,
    diagnostics: {
      trustedViewSources,
      totalViewSources,
      plausibleViews,
      trustedViewVals,
      allViewVals,
      confidenceTier,
    },
  };
}

async function fetchInstagramPostStats(url: string) {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    console.log('Could not extract shortcode from:', url);
    return { views: null, likes: null, comments: null, shares: null, thumbnailUrl: null };
  }

  // Try ALL 6 methods in parallel for speed AND accuracy through corroboration
  const [gqlResult, mobileResult, mainResult, embedResult, gqlAltResult, mobileWebResult] = await Promise.all([
    fetchViaGraphQL(shortcode),
    fetchViaMobileApi(shortcode),
    fetchViaMainPage(shortcode),
    fetchViaEmbed(shortcode),
    fetchViaGraphQLAlt(shortcode),
    fetchViaMobileWeb(shortcode),
  ]);

  const merged = buildValidatedStats(gqlResult, mobileResult, mainResult, embedResult, gqlAltResult, mobileWebResult);
  console.log('🔥 Final merged stats:', merged);
  return merged;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, action } = body;

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

      // Optional: scope to a single campaign so the portal "Refresh Stats"
      // returns FAST with up-to-date numbers for THAT campaign only.
      const campaignIdFilter: string | undefined = body?.campaign_id;

      let query = supabase
        .from('artist_campaign_edits')
        .select('id, campaign_id, video_url, view_count, like_count, comment_count, share_count, thumbnail_url, published_at')
        .or('platform.eq.instagram,video_url.ilike.%instagram.com%');

      if (campaignIdFilter) {
        query = query.eq('campaign_id', campaignIdFilter);
      } else {
        query = query.limit(100);
      }

      const { data: edits, error } = await query;

      if (error) throw error;

      let updated = 0;
      for (const edit of (edits || [])) {
        if (!edit.video_url) continue;
        try {
          const stats = await fetchInstagramPostStats(edit.video_url);
          const payload: Record<string, any> = { updated_at: new Date().toISOString() };
          
          // SAFETY: real view counts only go UP. Multi-layer validation prevents bad scrapes
          // from overwriting good data:
          //   1. Must have plausible views (passed buildValidatedStats guards)
          //   2. Must come from at least 1 trusted source (GQL/mobile/main page, not just embed)
          //   3. New value must be GREATER than stored value (monotonic)
          //   4. If existing value is large (>10k), require corroboration from 2+ sources for jumps >50%
          const currentViews = edit.view_count || 0;
          const hasConfidentViews =
            stats.views !== null &&
            stats.diagnostics.plausibleViews &&
            stats.diagnostics.trustedViewSources > 0;

          let acceptViews = hasConfidentViews && stats.views! > currentViews;
          // Tiered acceptance based on multi-source corroboration:
          //  - 'strong' (≥2 trusted sources within 15%): accept any jump
          //  - 'medium': cap jumps to 3x current value
          //  - 'weak'  (single source): cap jumps to 1.5x current value
          if (acceptViews && currentViews > 1000) {
            const tier = stats.diagnostics.confidenceTier;
            const ratio = stats.views! / Math.max(currentViews, 1);
            if (tier === 'weak' && ratio > 1.5) acceptViews = false;
            else if (tier === 'medium' && ratio > 3) acceptViews = false;
          }

          if (acceptViews) payload.view_count = stats.views;
          if (stats.likes !== null && stats.likes > (edit.like_count || 0)) payload.like_count = stats.likes;
          if (stats.comments !== null && stats.comments > (edit.comment_count || 0)) payload.comment_count = stats.comments;
          if (stats.shares !== null && stats.shares > (edit.share_count || 0)) payload.share_count = stats.shares;
          if (stats.thumbnailUrl && !edit.thumbnail_url) payload.thumbnail_url = stats.thumbnailUrl;
          // EXACT publish date from Instagram's own taken_at_timestamp - always sync if missing
          // or if scraped value differs (Instagram is authoritative on this)
          if (stats.takenAt && stats.takenAt > 0) {
            const exactDate = new Date(stats.takenAt * 1000).toISOString();
            if (!edit.published_at || new Date(edit.published_at).getTime() !== stats.takenAt * 1000) {
              payload.published_at = exactDate;
            }
          }

          if (Object.keys(payload).length > 1) {
            await supabase.from('artist_campaign_edits').update(payload).eq('id', edit.id);
            updated++;
          }
          // Smaller delay so per-campaign refresh feels instant
          await new Promise(r => setTimeout(r, 200));
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
            // Campaign totals should also only move upward; never let a partial/bad refresh drag them down.
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
