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

    let thumbnailUrl: string | null = null;

    // TikTok oEmbed API (public, no auth required)
    if (platform === 'tiktok' || url.includes('tiktok.com')) {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch (e) {
        console.error('TikTok oEmbed error:', e);
      }
    }

    // Instagram - try oEmbed (may require auth in some cases)
    if (platform === 'instagram' || url.includes('instagram.com')) {
      try {
        // Instagram oEmbed endpoint
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch (e) {
        console.error('Instagram oEmbed error:', e);
      }
    }

    // YouTube - direct thumbnail URL construction
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }

    return new Response(
      JSON.stringify({ thumbnailUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, thumbnailUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
