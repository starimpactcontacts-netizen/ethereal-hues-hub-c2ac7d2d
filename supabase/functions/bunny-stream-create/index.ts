import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STREAM_API_KEY = Deno.env.get('BUNNY_STREAM_API_KEY')!;
const STREAM_LIBRARY_ID = Deno.env.get('BUNNY_STREAM_LIBRARY_ID')!;
const STREAM_CDN_HOSTNAME = Deno.env.get('BUNNY_STREAM_CDN_HOSTNAME')!;

function normalizeCdnHost(value: string) {
  return String(value || '').replace(/^https?:\/\//i, '').replace(/\/.*$/g, '');
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a Bunny Stream video object and returns the TUS auth payload so the
 * BROWSER can upload bytes DIRECTLY to video.bunnycdn.com — zero bytes pass
 * through Lovable Cloud / Supabase edge runtime.
 *
 * Client uses tus-js-client against https://video.bunnycdn.com/tusupload with:
 *   AuthorizationSignature: sha256(libraryId + apiKey + expirationTime + videoId)
 *   AuthorizationExpire:    <unix seconds>
 *   VideoId:                <guid>
 *   LibraryId:              <id>
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

    const body = await req.json().catch(() => ({}));
    const fileName = String(body.fileName || `upload-${Date.now()}`).slice(0, 200);
    const safeTitle = `${user.id}/${fileName}`.slice(0, 200);

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

    // 24h upload window
    const expirationTime = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const signature = await sha256Hex(`${STREAM_LIBRARY_ID}${STREAM_API_KEY}${expirationTime}${guid}`);

    const cdn = normalizeCdnHost(STREAM_CDN_HOSTNAME);
    const uploadParams = new URLSearchParams({
      jitEnabled: 'true',
      enabledResolutions: '240p,360p,480p,720p,1080p',
      enabledOutputCodecs: 'x264',
    });

    return new Response(
      JSON.stringify({
        guid,
        libraryId: STREAM_LIBRARY_ID,
        signature,
        expirationTime,
        tusEndpoint: `https://video.bunnycdn.com/tusupload?${uploadParams.toString()}`,
        url: `https://${cdn}/${guid}/playlist.m3u8`,
        hlsUrl: `https://${cdn}/${guid}/playlist.m3u8`,
        mp4Url: `https://${cdn}/${guid}/play_480p.mp4`,
        thumbnailUrl: `https://${cdn}/${guid}/thumbnail.jpg`,
        previewUrl: `https://${cdn}/${guid}/preview.webp`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('bunny-stream-create error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});