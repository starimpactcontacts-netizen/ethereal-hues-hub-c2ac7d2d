import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { AccessToken } from 'npm:livekit-server-sdk@2.9.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;
    const meta = (userData.user.user_metadata || {}) as Record<string, any>;
    let username = meta.username || meta.display_name || '';
    let avatarUrl = '';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        username = profile.username || profile.display_name || username;
        avatarUrl = profile.avatar_url || '';
      }
    } catch (_) {}
    if (!username) username = userId.slice(0, 6);

    const body = await req.json().catch(() => ({}));
    const room = typeof body?.room === 'string' ? body.room.trim() : '';
    if (!room || room.length > 128) {
      return new Response(JSON.stringify({ error: 'Invalid room' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const url = Deno.env.get('LIVEKIT_URL');
    if (!apiKey || !apiSecret || !url) {
      return new Response(JSON.stringify({ error: 'LiveKit not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: username,
      ttl: 60 * 60 * 4,
      metadata: JSON.stringify({ username, avatar_url: avatarUrl }),
    });
    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const jwt = await at.toJwt();

    return new Response(JSON.stringify({ token: jwt, url, identity: userId, name: username }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('livekit-token error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});