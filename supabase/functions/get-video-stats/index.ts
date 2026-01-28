import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let views: number | null = null;
    let thumbnailUrl: string | null = null;
    let title: string | null = null;

    // TikTok - try multiple methods to get views
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
      console.log('Fetching TikTok stats for:', url);
      
      // First, resolve shortened URL if needed
      let resolvedUrl = url;
      if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
        try {
          const redirectRes = await fetch(url, { 
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
            }
          });
          resolvedUrl = redirectRes.url || url;
          console.log('Resolved TikTok URL:', resolvedUrl);
        } catch (e) {
          console.log('Could not resolve TikTok short URL, using original');
        }
      }

      // Extract video ID from URL
      const videoIdMatch = resolvedUrl.match(/video\/(\d+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      console.log('TikTok video ID:', videoId);

      // Method 1: Try scraping the mobile page for embedded JSON data
      try {
        console.log('Trying TikTok mobile page scrape...');
        const mobileRes = await fetch(resolvedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          }
        });

        if (mobileRes.ok) {
          const html = await mobileRes.text();
          
          // Try to find SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__ JSON
          const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/);
          const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
          
          if (sigiMatch) {
            try {
              const sigiData = JSON.parse(sigiMatch[1]);
              const itemModule = sigiData?.ItemModule;
              if (itemModule && videoId && itemModule[videoId]) {
                const videoData = itemModule[videoId];
                views = videoData.stats?.playCount || null;
                thumbnailUrl = videoData.video?.cover || videoData.video?.dynamicCover || null;
                title = videoData.desc || null;
                console.log('Got TikTok stats from SIGI_STATE:', { views, thumbnailUrl: !!thumbnailUrl, title: !!title });
              }
            } catch (e) {
              console.log('Failed to parse SIGI_STATE');
            }
          }
          
          if (!views && universalMatch) {
            try {
              const universalData = JSON.parse(universalMatch[1]);
              const defaultScope = universalData?.['__DEFAULT_SCOPE__'];
              const videoDetail = defaultScope?.['webapp.video-detail']?.itemInfo?.itemStruct;
              if (videoDetail) {
                views = videoDetail.stats?.playCount || null;
                thumbnailUrl = videoDetail.video?.cover || videoDetail.video?.dynamicCover || null;
                title = videoDetail.desc || null;
                console.log('Got TikTok stats from UNIVERSAL_DATA:', { views, thumbnailUrl: !!thumbnailUrl, title: !!title });
              }
            } catch (e) {
              console.log('Failed to parse UNIVERSAL_DATA');
            }
          }
          
          // Fallback: Try regex patterns on raw HTML
          if (!views) {
            // Look for playCount in any JSON structure
            const playCountMatch = html.match(/"playCount"\s*:\s*(\d+)/);
            if (playCountMatch) {
              views = parseInt(playCountMatch[1], 10);
              console.log('Got views from playCount regex:', views);
            }
          }
          
          if (!thumbnailUrl) {
            // Try to find cover image
            const coverMatch = html.match(/"cover"\s*:\s*"([^"]+)"/);
            if (coverMatch) {
              thumbnailUrl = coverMatch[1].replace(/\\u002F/g, '/');
              console.log('Got thumbnail from cover regex');
            }
          }
          
          if (!title) {
            // Try to find description
            const descMatch = html.match(/"desc"\s*:\s*"([^"]+)"/);
            if (descMatch) {
              title = descMatch[1];
            }
          }
        }
      } catch (e) {
        console.error('TikTok mobile scrape error:', e);
      }

      // Method 2: Try oEmbed API as fallback for thumbnail/title
      if (!thumbnailUrl || !title) {
        try {
          console.log('Trying TikTok oEmbed API...');
          const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
          const oembedRes = await fetch(oembedUrl, {
            headers: {
              'User-Agent': 'facebookexternalhit/1.1'
            }
          });
          
          if (oembedRes.ok) {
            const contentType = oembedRes.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const oembedData = await oembedRes.json();
              if (!thumbnailUrl) thumbnailUrl = oembedData.thumbnail_url || null;
              if (!title) title = oembedData.title || null;
              console.log('Got TikTok oEmbed data:', { thumbnailUrl: !!thumbnailUrl, title: !!title });
            }
          }
        } catch (e) {
          console.log('TikTok oEmbed failed');
        }
      }

      // Method 3: Desktop page scrape as final fallback
      if (!views) {
        try {
          console.log('Trying TikTok desktop scrape...');
          const desktopRes = await fetch(resolvedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            }
          });

          if (desktopRes.ok) {
            const html = await desktopRes.text();
            
            // Try various patterns
            const patterns = [
              /"playCount"\s*:\s*(\d+)/,
              /"play_count"\s*:\s*(\d+)/,
              /data-e2e="views-count"[^>]*>(\d+(?:\.\d+)?[KMB]?)/i,
              />(\d+(?:\.\d+)?[KMB]?)\s*(?:views|plays)</i,
            ];
            
            for (const pattern of patterns) {
              const match = html.match(pattern);
              if (match) {
                const viewStr = match[1];
                if (/^\d+$/.test(viewStr)) {
                  views = parseInt(viewStr, 10);
                } else {
                  views = parseViewCount(viewStr);
                }
                if (views) {
                  console.log('Got views from desktop pattern:', views);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.error('TikTok desktop scrape error:', e);
        }
      }
      
      console.log('Final TikTok stats:', { views, thumbnailUrl: !!thumbnailUrl, title: !!title });
    }

    // YouTube - direct thumbnail + try to get stats
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        
        // Try noembed for additional data
        try {
          const noembedRes = await fetch(`https://noembed.com/embed?url=https://youtube.com/watch?v=${videoId}`);
          if (noembedRes.ok) {
            const noembedData = await noembedRes.json();
            title = noembedData.title || null;
          }
        } catch (e) {
          console.log('noembed fetch failed');
        }
      }
    }

    // Instagram - try oEmbed
    if (platform === 'instagram' || url.includes('instagram.com')) {
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          thumbnailUrl = data.thumbnail_url || null;
          title = data.title || null;
        }
      } catch (e) {
        console.error('Instagram oEmbed error:', e);
      }
    }

    return new Response(
      JSON.stringify({ 
        views, 
        thumbnailUrl, 
        title,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching video stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, views: null, thumbnailUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to parse view counts like "1.5M", "500K", "12345"
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
