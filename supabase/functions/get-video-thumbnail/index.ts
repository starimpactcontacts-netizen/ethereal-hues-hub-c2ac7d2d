const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Resolve short URLs ──────────────────────────────────

async function resolveShortUrl(url: string): Promise<string> {
  // Use mobile UA — same as get-video-stats which works
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const resolved = res.url || url;
    // If it resolved to /notfound, the link is dead
    if (resolved.includes('/notfound')) {
      console.log('Short URL expired (notfound):', url);
      return url; // return original, we'll handle failure gracefully
    }
    if (resolved !== url) {
      console.log('Resolved:', url, '->', resolved);
    }
    return resolved;
  } catch (e) {
    console.log('Redirect resolve failed:', e);
    return url;
  }
}

function isShortTikTok(url: string): boolean {
  return /^https?:\/\/(vm|vt)\.tiktok\.com\//i.test(url)
    || /^https?:\/\/(www\.)?tiktok\.com\/t\//i.test(url);
}

// ── TikTok thumbnail — same approach as get-video-stats ──

async function getTikTokThumbnail(url: string): Promise<string | null> {
  let resolvedUrl = url;

  // Step 1: Resolve short URLs
  if (isShortTikTok(url)) {
    resolvedUrl = await resolveShortUrl(url);
  }

  const videoIdMatch = resolvedUrl.match(/video\/(\d+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  // Step 2: Mobile page scrape — parse embedded JSON (PROVEN approach from get-video-stats)
  try {
    console.log('TikTok mobile scrape for:', resolvedUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // Try SIGI_STATE
      const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/);
      if (sigiMatch) {
        try {
          const sigiData = JSON.parse(sigiMatch[1]);
          const itemModule = sigiData?.ItemModule;
          if (itemModule && videoId && itemModule[videoId]) {
            const videoData = itemModule[videoId];
            const thumb = videoData.video?.cover || videoData.video?.dynamicCover || null;
            if (thumb) { console.log('TikTok thumb from SIGI_STATE'); return thumb; }
          }
          // If no videoId match, try first item
          if (itemModule) {
            const firstKey = Object.keys(itemModule)[0];
            if (firstKey) {
              const videoData = itemModule[firstKey];
              const thumb = videoData?.video?.cover || videoData?.video?.dynamicCover || null;
              if (thumb) { console.log('TikTok thumb from SIGI_STATE (first item)'); return thumb; }
            }
          }
        } catch (e) {
          console.log('SIGI_STATE parse failed');
        }
      }

      // Try __UNIVERSAL_DATA_FOR_REHYDRATION__
      const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
      if (universalMatch) {
        try {
          const universalData = JSON.parse(universalMatch[1]);
          const defaultScope = universalData?.['__DEFAULT_SCOPE__'];
          const videoDetail = defaultScope?.['webapp.video-detail']?.itemInfo?.itemStruct;
          if (videoDetail) {
            const thumb = videoDetail.video?.cover || videoDetail.video?.dynamicCover || null;
            if (thumb) { console.log('TikTok thumb from UNIVERSAL_DATA'); return thumb; }
          }
        } catch (e) {
          console.log('UNIVERSAL_DATA parse failed');
        }
      }

      // Regex fallback: find cover in any JSON
      const coverMatch = html.match(/"cover"\s*:\s*"(https?:[^"]+)"/);
      if (coverMatch) {
        const thumb = coverMatch[1].replace(/\\u002F/g, '/');
        console.log('TikTok thumb from cover regex');
        return thumb;
      }

      // og:image fallback
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogMatch?.[1]) {
        console.log('TikTok thumb from og:image');
        return ogMatch[1];
      }
    }
  } catch (e) {
    console.log('TikTok mobile scrape error:', e);
  }

  // Step 3: oEmbed fallback
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolvedUrl)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (data.thumbnail_url) { console.log('TikTok thumb from oEmbed'); return data.thumbnail_url; }
      }
    }
  } catch (e) {
    console.log('TikTok oEmbed error:', e);
  }

  return null;
}

// ── Instagram thumbnail ──

async function getInstagramThumbnail(url: string): Promise<string | null> {
  // Method 1: oEmbed
  try {
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'facebookexternalhit/1.1' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (data.thumbnail_url) { console.log('IG thumb from oEmbed'); return data.thumbnail_url; }
      }
    }
  } catch (e) {
    console.log('IG oEmbed error:', e);
  }

  // Method 2: Scrape og:image with mobile UA
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const html = await res.text();
      const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (ogMatch?.[1]) { console.log('IG thumb from og:image'); return ogMatch[1]; }
    }
  } catch (e) {
    console.log('IG scrape error:', e);
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────

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

    // YouTube — instant
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }

    // TikTok
    if (!thumbnailUrl && (platform === 'tiktok' || url.includes('tiktok.com'))) {
      thumbnailUrl = await getTikTokThumbnail(url);
    }

    // Instagram
    if (!thumbnailUrl && (platform === 'instagram' || url.includes('instagram.com'))) {
      thumbnailUrl = await getInstagramThumbnail(url);
    }

    // Generic fallback — scrape og:image
    if (!thumbnailUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const html = await res.text();
          const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
          if (ogMatch?.[1]) thumbnailUrl = ogMatch[1];
        }
      } catch { /* give up */ }
    }

    console.log('FINAL:', url.substring(0, 60), '->', thumbnailUrl ? 'RESOLVED' : 'NULL');

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
