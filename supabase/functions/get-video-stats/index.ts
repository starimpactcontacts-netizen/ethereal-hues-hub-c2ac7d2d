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

    // TikTok - try oEmbed first, then try scraping
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
      try {
        // First, try to resolve shortened URL
        let resolvedUrl = url;
        if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
          try {
            const redirectRes = await fetch(url, { 
              method: 'HEAD',
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            resolvedUrl = redirectRes.url || url;
          } catch (e) {
            console.log('Could not resolve TikTok short URL');
          }
        }

        // Try oEmbed for thumbnail and title
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });
        
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          thumbnailUrl = oembedData.thumbnail_url || null;
          title = oembedData.title || null;
        }

        // Try to scrape the page for view count
        const pageRes = await fetch(resolvedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          
          // Try to find view count in various formats
          // Look for playCount in JSON data
          const playCountMatch = html.match(/"playCount"\s*:\s*(\d+)/);
          if (playCountMatch) {
            views = parseInt(playCountMatch[1], 10);
          }
          
          // Alternative: look for stats in meta tags or other patterns
          if (!views) {
            const viewsMatch = html.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:views|plays)/i);
            if (viewsMatch) {
              views = parseViewCount(viewsMatch[1]);
            }
          }
        }
      } catch (e) {
        console.error('TikTok fetch error:', e);
      }
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
