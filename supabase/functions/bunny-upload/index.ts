import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-file-name, x-file-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STORAGE_HOST = Deno.env.get('BUNNY_STORAGE_HOST') || 'storage.bunnycdn.com';
const STORAGE_ZONE = Deno.env.get('BUNNY_STORAGE_ZONE')!;
const STORAGE_PASSWORD = Deno.env.get('BUNNY_STORAGE_PASSWORD')!;
const CDN_HOSTNAME = Deno.env.get('BUNNY_CDN_HOSTNAME')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth check
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

    const fileName = req.headers.get('x-file-name') || 'file.bin';
    const fileType = req.headers.get('x-file-type') || 'application/octet-stream';
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const url = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${path}`;
    const bunnyRes = await fetch(url, {
      method: 'PUT',
      headers: {
        AccessKey: STORAGE_PASSWORD,
        'Content-Type': fileType,
      },
      body: req.body,
    });

    if (!bunnyRes.ok) {
      const text = await bunnyRes.text();
      console.error('Bunny upload failed', bunnyRes.status, text);
      return new Response(JSON.stringify({ error: `Bunny ${bunnyRes.status}: ${text}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cdnUrl = `https://${CDN_HOSTNAME}/${path}`;
    return new Response(JSON.stringify({ url: cdnUrl, path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Upload error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});