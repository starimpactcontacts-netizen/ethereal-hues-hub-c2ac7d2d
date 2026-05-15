import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-file-name, x-file-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY')!;
const STREAM_LIBRARY_ID = Deno.env.get('BUNNY_STREAM_LIBRARY_ID')!;
const STREAM_CDN_HOSTNAME = Deno.env.get('BUNNY_STREAM_CDN_HOSTNAME')!;
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1GB

function normalizeCdnHost(value: string) {
  return String(value || '').replace(/^https?:\/\//i, '').replace(/\/.*$/g, '');
}

/**
 * Bunny **Stream** upload proxy (NOT Bunny Storage).
 *
 * 1. Creates a video object in the configured Stream Library
 * 2. Streams the request body straight to Bunny's PUT endpoint
 * 3. Returns the HLS playlist URL + thumbnail URL + raw guid
 *
 * Bunny then transcodes server-side into HLS + multiple bitrates within seconds.
 * Playback URL: https://{cdn}/{guid}/playlist.m3u8 (adaptive bitrate, instant start)
 * Thumbnail:    https://{cdn}/{guid}/thumbnail.jpg
 * MP4 fallback: https://{cdn}/{guid}/play_720p.mp4
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawName = req.headers.get('x-file-name') || `upload-${Date.now()}`;
    const contentLength = req.headers.get('content-length') || undefined;
    const byteLength = contentLength ? Number(contentLength) : 0;
    if (byteLength && byteLength > MAX_UPLOAD_BYTES) {
      return new Response(JSON.stringify({ error: 'File too big — 1GB max' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Title is just for the Bunny dashboard. Encode user id + filename for traceability.
    const safeTitle = `${user.id}/${rawName}`.slice(0, 200);

    // 1) Create video object
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: STREAM_API_KEY,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ title: safeTitle }),
      },
    );
    if (!createRes.ok) {
      const text = await createRes.text();
      console.error('Bunny Stream create failed', createRes.status, text);
      return new Response(JSON.stringify({ error: `Bunny create ${createRes.status}: ${text}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const created = await createRes.json();
    const guid = created.guid as string;
    if (!guid) {
      return new Response(JSON.stringify({ error: 'Bunny did not return guid' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Upload bytes straight through (duplex: 'half' required for streaming body in Deno)
    const uploadHeaders: Record<string, string> = {
      AccessKey: STREAM_API_KEY,
      'Content-Type': 'application/octet-stream',
    };
    if (contentLength) uploadHeaders['Content-Length'] = contentLength;

    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${STREAM_LIBRARY_ID}/videos/${guid}`,
      {
        method: 'PUT',
        headers: uploadHeaders,
        body: req.body,
        // @ts-ignore — duplex valid in Deno fetch but missing from lib.dom
        duplex: 'half',
      },
    );
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error('Bunny Stream upload failed', uploadRes.status, text);
      return new Response(JSON.stringify({ error: `Bunny upload ${uploadRes.status}: ${text}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cdn = normalizeCdnHost(STREAM_CDN_HOSTNAME);
    const hlsUrl = `https://${cdn}/${guid}/playlist.m3u8`;
    const mp4Url = `https://${cdn}/${guid}/play_720p.mp4`;
    const thumbnailUrl = `https://${cdn}/${guid}/thumbnail.jpg`;
    const previewUrl = `https://${cdn}/${guid}/preview.webp`;

    return new Response(
      JSON.stringify({
        guid,
        // Use HLS as the canonical URL — adaptive bitrate, instant start.
        url: hlsUrl,
        hlsUrl,
        mp4Url,
        thumbnailUrl,
        previewUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('bunny-stream-upload error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});