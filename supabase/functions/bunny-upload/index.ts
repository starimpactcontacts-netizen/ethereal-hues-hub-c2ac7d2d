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
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;

function normalizeCdnHost(value: string) {
  return value.replace(/^https?:\/\//i, '').replace(/\/.*$/g, '');
}

function normalizeStorageConfig(hostValue: string, zoneValue: string) {
  const rawHost = String(hostValue || '').trim();
  const rawZone = String(zoneValue || '').trim();

  if (/^https?:\/\//i.test(rawZone)) {
    const url = new URL(rawZone);
    const zone = url.pathname.split('/').filter(Boolean)[0] || rawHost || 'loop-media';
    return { host: url.hostname, zone };
  }

  if (/^https?:\/\//i.test(rawHost)) {
    const url = new URL(rawHost);
    const hostZone = url.pathname.split('/').filter(Boolean)[0];
    return { host: url.hostname, zone: rawZone || hostZone || 'loop-media' };
  }

  return {
    host: rawHost.includes('.') ? rawHost : 'storage.bunnycdn.com',
    zone: rawZone || rawHost || 'loop-media',
  };
}

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

    const rawName = req.headers.get('x-file-name') || 'file.bin';
    const fileType = req.headers.get('x-file-type') || 'application/octet-stream';
    const contentLength = req.headers.get('content-length') || undefined;
    const byteLength = contentLength ? Number(contentLength) : 0;
    if (byteLength && byteLength > MAX_UPLOAD_BYTES) {
      return new Response(JSON.stringify({ error: 'File too big — 1GB max' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // x-file-name may contain a folder prefix like "battle-edits/clip.mp4"
    const lastSlash = rawName.lastIndexOf('/');
    const folder = lastSlash >= 0 ? rawName.slice(0, lastSlash).replace(/^\/+|\/+$/g, '') : '';
    const justName = lastSlash >= 0 ? rawName.slice(lastSlash + 1) : rawName;
    const ext = justName.includes('.') ? justName.split('.').pop() : 'bin';
    const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
    const folderPart = safeFolder ? `${safeFolder}/` : '';
    const path = `${folderPart}${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const storage = normalizeStorageConfig(STORAGE_HOST, STORAGE_ZONE);
    const url = `https://${storage.host}/${storage.zone}/${path}`;
    const bunnyHeaders: Record<string, string> = {
      AccessKey: STORAGE_PASSWORD,
      'Content-Type': fileType,
    };
    if (contentLength) bunnyHeaders['Content-Length'] = contentLength;

    // Stream the body straight through. `duplex: 'half'` is REQUIRED in Deno
    // when forwarding a ReadableStream as a fetch body — without it the
    // request silently aborts on large uploads (which is why the client sees
    // "100% then nothing").
    const bunnyRes = await fetch(url, {
      method: 'PUT',
      headers: bunnyHeaders,
      body: req.body,
      // @ts-ignore — duplex is valid in Deno's fetch but missing from lib.dom
      duplex: 'half',
    });

    if (!bunnyRes.ok) {
      const text = await bunnyRes.text();
      console.error('Bunny upload failed', bunnyRes.status, text);
      return new Response(JSON.stringify({ error: `Bunny ${bunnyRes.status}: ${text}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cdnUrl = `https://${normalizeCdnHost(CDN_HOSTNAME)}/${path}`;
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