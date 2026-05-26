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

    const contentType = req.headers.get('content-type') || '';

    // Proxy mode: file sent as multipart/form-data — upload server-side to avoid browser CORS issues
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const folder = String(form.get('folder') || '');

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '');
      const justName = file.name.split('/').pop() || 'file.bin';
      const ext = justName.includes('.') ? justName.split('.').pop() : 'bin';
      const folderPart = safeFolder ? `${safeFolder}/` : '';
      const path = `${folderPart}${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

      const uploadUrl = `https://${STORAGE_HOST}/${STORAGE_ZONE}/${path}`;
      const cdnUrl = `https://${CDN_HOSTNAME}/${path}`;

      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { AccessKey: STORAGE_PASSWORD },
        body: await file.arrayBuffer(),
      });

      if (!put.ok) {
        const detail = await put.text().catch(() => '');
        return new Response(JSON.stringify({ error: `Bunny upload failed: ${put.status} ${detail}` }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ cdnUrl, path }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sign-only mode: return upload target for client-side direct PUT (large videos)
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
