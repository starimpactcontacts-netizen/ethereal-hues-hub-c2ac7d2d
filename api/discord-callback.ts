import { createClient } from '@supabase/supabase-js';

const DISCORD_CLIENT_ID = '1508087834555187291';
const DISCORD_REDIRECT_URI = 'https://loopgate.gg/auth/discord/callback';

/**
 * Calls the auto-confirm-user edge function (which uses its own service role
 * key) so we don't need to expose the service role key here.
 */
async function confirmSyntheticEmail(supabaseUrl: string, email: string): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/functions/v1/auto-confirm-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    // Non-fatal — sign-in attempt will surface any real error
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', 'https://loopgate.gg');
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

  // 3. Stable synthetic email keyed to Discord ID (never collides with real emails)
  const syntheticEmail = `discord_${discordUser.id}@user.loopgate.io`;
  const derivedPassword = `dsc_${discordUser.id}_${clientSecret.slice(-12)}`;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const discordMeta = {
    discord_id: discordUser.id,
    discord_username: discordUser.username,
    discord_email: discordUser.email,
    full_name: discordUser.global_name || discordUser.username,
    avatar_url: discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=256`
      : null,
  };

  // 4. Happy path: returning user signs in with stored password
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

  // 5. Sign-in failed — most common cause: account exists but email was never
  //    confirmed (e.g. created before email auto-confirm was enabled in Supabase).
  //    Use the auto-confirm-user edge function (which owns the service role key)
  //    to confirm it, then retry sign-in before ever touching signUp.
  await confirmSyntheticEmail(supabaseUrl, syntheticEmail);

  const { data: retrySignIn, error: retryErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: derivedPassword,
  });

  if (!retryErr && retrySignIn.session) {
    return res.status(200).json({
      access_token: retrySignIn.session.access_token,
      refresh_token: retrySignIn.session.refresh_token,
      discord_username: discordUser.username,
      discord_global_name: discordUser.global_name || null,
      isNew: false,
    });
  }

  // 6. Still failing — this Discord ID genuinely has no account. Create one.
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: syntheticEmail,
    password: derivedPassword,
    options: { data: discordMeta },
  });

  if (signUpErr) {
    return res.status(500).json({ error: signUpErr.message });
  }

  if (signUpData.session) {
    return res.status(200).json({
      access_token: signUpData.session.access_token,
      refresh_token: signUpData.session.refresh_token,
      discord_username: discordUser.username,
      discord_global_name: discordUser.global_name || null,
      isNew: true,
    });
  }

  // 7. signUp returned no session (project requires email confirmation).
  //    Confirm via edge function then sign in.
  await confirmSyntheticEmail(supabaseUrl, syntheticEmail);

  const { data: finalSignIn, error: finalErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: derivedPassword,
  });

  if (!finalErr && finalSignIn.session) {
    return res.status(200).json({
      access_token: finalSignIn.session.access_token,
      refresh_token: finalSignIn.session.refresh_token,
      discord_username: discordUser.username,
      discord_global_name: discordUser.global_name || null,
      isNew: true,
    });
  }

  return res.status(200).json({ needsEmailConfirm: true });
}
