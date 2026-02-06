const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SCRAPE_UAS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatype.php)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// ── Helpers ──────────────────────────────────────────────

/** Follow redirects on a short URL to get the final destination */
async function resolveRedirect(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    // Use HEAD with manual redirect to follow the chain
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'User-Agent': SCRAPE_UAS[0] },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // res.url is the final URL after redirects
    if (res.url && res.url !== url) {
      console.log('Resolved redirect:', url, '->', res.url);
      return res.url;
    }
  } catch (e) {
    console.log('HEAD redirect failed, trying GET:', e);
    // Fallback: GET request (some servers don't support HEAD)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': SCRAPE_UAS[0] },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.url && res.url !== url) {
        console.log('Resolved redirect (GET):', url, '->', res.url);
        return res.url;
      }
    } catch (e2) {
      console.log('GET redirect also failed:', e2);
    }
  }
  return url;
}

/** Check if a URL is a shortened TikTok link */
function isShortTikTok(url: string): boolean {
  return /^https?:\/\/(vm|vt)\.tiktok\.com\//i.test(url)
    || /^https?:\/\/(www\.)?tiktok\.com\/t\//i.test(url);
}

/** Extract TikTok video ID from a full URL */
function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

/** Extract og:image from HTML */
function extractOgImage(html: string): string | null {
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch?.[1]) return twMatch[1];

  // JSON embedded thumbnail
  const jsonThumb = html.match(/"thumbnail_url"\s*:\s*"([^"]+)"/i)
    || html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/i)
    || html.match(/"cover"\s*:\s*"([^"]+)"/i)
    || html.match(/"thumbnail"\s*:\s*\{[^}]*"url_list"\s*:\s*\["([^"]+)"/i);
  if (jsonThumb?.[1]) return jsonThumb[1].replace(/\\u002F/g, '/').replace(/\\/g, '');

  return null;
}

/** Scrape a page and extract og:image with UA fallbacks */
async function scrapeOgImage(url: string): Promise<string | null> {
  for (const ua of SCRAPE_UAS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        const img = extractOgImage(text);
        if (img) return img;
      }
    } catch {
      // next UA
    }
  }
  return null;
}

// ── Main handler ─────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url: rawUrl, platform } = await req.json();

    if (!rawUrl) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let thumbnailUrl: string | null = null;
    let url = rawUrl;

    // ── YouTube — instant, zero network ──
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }

    // ── TikTok ──
    if (!thumbnailUrl && (platform === 'tiktok' || url.includes('tiktok.com'))) {
      // Step 1: Resolve short URLs to full URLs
      if (isShortTikTok(url)) {
        url = await resolveRedirect(url);
        console.log('Resolved TikTok URL:', url);
      }

      // Step 2: Try oEmbed with the FULL URL
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': SCRAPE_UAS[0] },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            thumbnailUrl = data.thumbnail_url || null;
            console.log('TikTok oEmbed result:', thumbnailUrl ? 'found' : 'null');
          } else {
            console.log('TikTok oEmbed returned non-JSON:', contentType);
          }
        }
      } catch (e) {
        console.log('TikTok oEmbed error:', e);
      }

      // Step 3: Scrape og:image from the page
      if (!thumbnailUrl) {
        console.log('Scraping TikTok page for og:image...');
        thumbnailUrl = await scrapeOgImage(url);
        // Also try original URL if we resolved it
        if (!thumbnailUrl && url !== rawUrl) {
          thumbnailUrl = await scrapeOgImage(rawUrl);
        }
      }
    }

    // ── Instagram ──
    if (!thumbnailUrl && (platform === 'instagram' || url.includes('instagram.com'))) {
      // Step 1: Try oEmbed
      try {
        const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(oembedUrl, {
          headers: { 'User-Agent': SCRAPE_UAS[0] },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            thumbnailUrl = data.thumbnail_url || null;
          }
        }
      } catch (e) {
        console.log('Instagram oEmbed error:', e);
      }

      // Step 2: Scrape og:image
      if (!thumbnailUrl) {
        console.log('Scraping Instagram page for og:image...');
        thumbnailUrl = await scrapeOgImage(url);
      }
    }

    // ── Generic fallback ──
    if (!thumbnailUrl) {
      thumbnailUrl = await scrapeOgImage(url);
    }

    console.log('FINAL result for', rawUrl, '->', thumbnailUrl ? 'RESOLVED' : 'NULL');

    return new Response(
      JSON.stringify({ thumbnailUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error), thumbnailUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
