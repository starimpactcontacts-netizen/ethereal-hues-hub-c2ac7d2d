const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching preview for:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Lovable/1.0; +https://lovable.dev)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    // Parse Open Graph and meta tags
    const getMetaContent = (property: string): string | null => {
      // Try og: tags first
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i'));
      if (ogMatch) return ogMatch[1];

      // Try twitter: tags
      const twitterMatch = html.match(new RegExp(`<meta[^>]*name=["']twitter:${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:${property}["']`, 'i'));
      if (twitterMatch) return twitterMatch[1];

      // Try regular meta tags
      const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'));
      if (metaMatch) return metaMatch[1];

      return null;
    };

    // Get title
    let title = getMetaContent('title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    // Get description
    const description = getMetaContent('description');

    // Get image
    let image = getMetaContent('image');
    if (image && !image.startsWith('http')) {
      // Make relative URLs absolute
      const urlObj = new URL(url);
      image = image.startsWith('/') 
        ? `${urlObj.origin}${image}`
        : `${urlObj.origin}/${image}`;
    }

    // Get favicon
    let favicon: string | null = null;
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (faviconMatch) {
      favicon = faviconMatch[1];
      if (!favicon.startsWith('http')) {
        const urlObj = new URL(url);
        favicon = favicon.startsWith('/') 
          ? `${urlObj.origin}${favicon}`
          : `${urlObj.origin}/${favicon}`;
      }
    } else {
      // Default to /favicon.ico
      const urlObj = new URL(url);
      favicon = `${urlObj.origin}/favicon.ico`;
    }

    // Get site name
    const siteName = getMetaContent('site_name') || new URL(url).hostname;

    const preview = {
      url,
      title: title?.substring(0, 200),
      description: description?.substring(0, 300),
      image,
      favicon,
      siteName,
    };

    console.log('Preview generated:', preview.title);

    return new Response(
      JSON.stringify(preview),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching preview:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate preview' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
