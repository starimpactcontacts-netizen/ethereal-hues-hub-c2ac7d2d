import { createClient } from '@supabase/supabase-js';

const DISCORD_CLIENT_ID = '1508087834555187291';
const DISCORD_REDIRECT_URI = 'https://loopgate.io/auth/discord/callback';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', 'https://loopgate.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const code = req.query?.code as string;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!clientSecret || !supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing env vars' });
  }

  // 1. Exchange code for Discord access token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    return res.status(400).json({ error: 'Discord token exchange failed', detail });
  }
  const { access_token } = await tokenRes.json();

  // 2. Fetch Discord user info
  const discordRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const discordUser = await discordRes.json();

  // 3. Use a synthetic email keyed to Discord ID so Discord accounts never
  //    collide with existing Google/email accounts on the same email address.
  const syntheticEmail = `discord_${discordUser.id}@auth.loopgate.io`;
  const derivedPassword = `dsc_${discordUser.id}_${clientSecret.slice(-12)}`;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 4. Try signing in first (existing user)
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: derivedPassword,
  });

  if (!signInErr && signInData.session) {
    return res.status(200).json({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      discord_username: discordUser.username,
      discord_global_name: discordUser.global_name || null,
      isNew: false,
    });
  }

  // 5. Sign-in failed — user doesn't exist yet, create them
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: syntheticEmail,
    password: derivedPassword,
    options: {
      data: {
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        discord_email: discordUser.email,
        full_name: discordUser.global_name || discordUser.username,
        avatar_url: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=256`
          : null,
      },
    },
  });

  if (signUpErr) {
    return res.status(500).json({ error: signUpErr.message });
  }

  if (!signUpData.session) {
    // Email confirmation is required on this Supabase project
    return res.status(200).json({ needsEmailConfirm: true });
  }

  return res.status(200).json({
    access_token: signUpData.session.access_token,
    refresh_token: signUpData.session.refresh_token,
    discord_username: discordUser.username,
    discord_global_name: discordUser.global_name || null,
    isNew: true,
  });
}
