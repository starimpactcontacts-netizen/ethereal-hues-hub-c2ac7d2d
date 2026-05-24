import { createClient } from '@supabase/supabase-js';

const DISCORD_CLIENT_ID = '1508087834555187291';
const DISCORD_REDIRECT_URI = 'https://loopgate.io/auth/discord/callback';
const SUPABASE_URL = 'https://tmfnqnmyxxydrxwjkaiq.supabase.co';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', 'https://loopgate.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const code = req.query?.code as string;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clientSecret || !serviceRoleKey) {
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

  if (!discordUser.email) {
    return res.status(400).json({ error: 'Discord account has no email. Enable email in Discord settings.' });
  }
  if (!discordUser.verified) {
    return res.status(400).json({ error: 'Discord email is not verified. Please verify your Discord email first.' });
  }

  // 3. Supabase admin client
  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=256`
    : null;

  // 4. Try to create user — if it fails for any reason (e.g. already exists), we still
  //    proceed to generateLink below. Only mark isNew=true on success.
  let isNew = false;
  const { error: createErr } = await supabase.auth.admin.createUser({
    email: discordUser.email,
    email_confirm: true,
    user_metadata: {
      discord_id: discordUser.id,
      discord_username: discordUser.username,
      full_name: discordUser.global_name || discordUser.username,
      avatar_url: avatarUrl,
    },
  });
  if (!createErr) isNew = true;

  // 5. Generate a one-time magic link token — works whether user is new or existing.
  //    If this fails, something is genuinely wrong (bad service role key, wrong project URL, etc.)
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: discordUser.email,
  });

  if (linkErr || !linkData) {
    return res.status(500).json({
      error: 'Failed to sign in',
      detail: linkErr?.message,
      createDetail: createErr?.message,
    });
  }

  return res.status(200).json({
    token_hash: linkData.properties.hashed_token,
    isNew,
  });
}
