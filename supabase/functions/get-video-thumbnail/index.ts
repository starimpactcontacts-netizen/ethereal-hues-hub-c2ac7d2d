const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatype.php)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/** Extract og:image or twitter:image from raw HTML */
function extractOgImage(html: string): string | null {
  // Try og:image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // Try twitter:image
  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch?.[1]) return twMatch[1];

  // Try thumbnail_url in JSON-LD or embedded JSON
  const jsonThumb = html.match(/"thumbnail_url"\s*:\s*"([^"]+)"/i)
    || html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i)
    || html.match(/"cover"\s*:\s*"([^"]+)"/i);
  if (jsonThumb?.[1]) return jsonThumb[1].replace(/\\u002F/g, '/');

  return null;
}

/** Fetch page HTML with multiple user-agent fallbacks */
async function fetchPageHtml(url: string): Promise<string | null> {
  for (const ua of USER_AGENTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        if (text.length > 500) return text; // got real content
      }
    } catch {
      // try next UA
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // ---------- YouTube — instant, no fetch needed ----------
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }

    // ---------- TikTok ----------
    if (!thumbnailUrl && (platform === 'tiktok' || url.includes('tiktok.com'))) {
      // 1) Try oEmbed first (fast)
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': USER_AGENTS[0] },
        });
        if (res.ok) {
          const data = await res.json();
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch (e) {
        console.log('TikTok oEmbed failed:', e);
      }

      // 2) Fallback: scrape og:image from the page
      if (!thumbnailUrl) {
        console.log('TikTok oEmbed returned null, scraping page for og:image...');
        const html = await fetchPageHtml(url);
        if (html) {
          thumbnailUrl = extractOgImage(html);
          console.log('TikTok og:image result:', thumbnailUrl ? 'found' : 'not found');
        }
      }
    }

    // ---------- Instagram ----------
    if (!thumbnailUrl && (platform === 'instagram' || url.includes('instagram.com'))) {
      // 1) Try oEmbed
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': USER_AGENTS[0] },
        });
        if (res.ok) {
          const data = await res.json();
          thumbnailUrl = data.thumbnail_url || null;
        }
      } catch (e) {
        console.log('Instagram oEmbed failed:', e);
      }

      // 2) Fallback: scrape og:image
      if (!thumbnailUrl) {
        console.log('Instagram oEmbed returned null, scraping page for og:image...');
        const html = await fetchPageHtml(url);
        if (html) {
          thumbnailUrl = extractOgImage(html);
          console.log('Instagram og:image result:', thumbnailUrl ? 'found' : 'not found');
        }
      }
    }

    // ---------- Generic fallback for unknown platforms ----------
    if (!thumbnailUrl) {
      console.log('Generic fallback: scraping page for og:image...');
      const html = await fetchPageHtml(url);
      if (html) {
        thumbnailUrl = extractOgImage(html);
      }
    }

    console.log('Final thumbnail result for', url, ':', thumbnailUrl ? 'resolved' : 'null');

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
