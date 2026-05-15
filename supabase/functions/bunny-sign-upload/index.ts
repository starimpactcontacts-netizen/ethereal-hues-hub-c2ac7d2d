import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STORAGE_HOST = Deno.env.get('BUNNY_STORAGE_HOST') || 'storage.bunnycdn.com';
const STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE')!;
const STORAGE_PASSWORD = Deno.env.get('BUNNY_STORAGE_PASSWORD')!;
const CDN_HOSTNAME = Deno.env.get('BUNNY_CDN_HOSTNAME')!;

/**
 * Issues a direct-PUT target for Bunny Storage so the browser can upload
 * straight to storage.bunnycdn.com (no proxy hop through the edge function).
 *
 * Auth-gated: only signed-in users get a target. The AccessKey is returned
 * to the client — this trades a small write-scope risk for ~50% faster uploads
 * on big video files.
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
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileName = 'file.bin', folder = '' } = await req.json().catch(() => ({}));
    const safeFolder = String(folder).replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '');
    const justName = String(fileName).split('/').pop() || 'file.bin';
    const ext = justName.includes('.') ? justName.split('.').pop() : 'bin';
    const folderPart = safeFolder ? `${safeFolder}/` : '';
    const path = `${folderPart}${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const uploadUrl = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${path}`;
    const cdnUrl = `https://${CDN_HOSTNAME}/${path}`;

    return new Response(JSON.stringify({
      uploadUrl,
      accessKey: STORAGE_PASSWORD,
      cdnUrl,
      path,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Sign error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});