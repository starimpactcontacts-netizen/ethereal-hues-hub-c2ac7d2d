import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Type',
};

const STORAGE_PASSWORD = Deno.env.get('BUNNY_STORAGE_PASSWORD')!;
const STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE') || 'loop-media';

function normalizeStoragePath(input: string) {
  const url = new URL(input);
  if (url.hostname !== 'storage.bunnycdn.com') throw new Error('Unsupported video host');
  const parts = url.pathname.split('/').filter(Boolean);
  const zone = parts[0] || STORAGE_ZONE;
  const path = parts.slice(1).join('/');
  if (!path) throw new Error('Missing video path');
  return `https://storage.bunnycdn.com/${zone}/${path}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      await supabase.auth.getUser();
    }

    const source = new URL(req.url).searchParams.get('url');
    if (!source) throw new Error('Missing video URL');
    const storageUrl = normalizeStoragePath(source);
    const range = req.headers.get('range');

    const upstream = await fetch(storageUrl, {
      method: req.method,
      headers: {
        AccessKey: STORAGE_PASSWORD,
        ...(range ? { Range: range } : {}),
      },
    });

    const headers = new Headers(corsHeaders);
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(req.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});