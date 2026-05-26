import { createClient } from '@supabase/supabase-js';

const DISCORD_CLIENT_ID = '1508087834555187291';
const DISCORD_REDIRECT_URI = 'https://loopgate.gg/auth/discord/callback';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', 'https://loopgate.gg');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const code = req.query?.code as string;
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  // 3. Stable synthetic email and password keyed to Discord ID.
  //    NOTE: derivedPassword depends on clientSecret — if the secret is ever
  //    rotated, we use the admin client below to reset it for existing users.
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

  // 4. Happy path: returning user signs in with their stored password
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

  // 5. Sign-in failed — use admin API to find-or-create without creating duplicates.
  //    This handles: first-time users, and users whose derived password changed
  //    because DISCORD_CLIENT_SECRET was rotated.
  if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find existing user by synthetic email
    let existingUserId: string | null = null;
    let page = 1;
    while (page <= 10 && !existingUserId) {
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listErr) break;
      const found = listData.users.find(u => (u.email || '').toLowerCase() === syntheticEmail.toLowerCase());
      if (found) { existingUserId = found.id; break; }
      if (listData.users.length < 1000) break;
      page++;
    }

    if (existingUserId) {
      // User exists — reset password to current derivedPassword (handles secret rotation)
      // and ensure email is confirmed.
      await admin.auth.admin.updateUserById(existingUserId, {
        password: derivedPassword,
        email_confirm: true,
      });

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
    } else {
      // Brand new Discord user — create confirmed, no email verification needed
      const { data: newUserData, error: createErr } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        password: derivedPassword,
        email_confirm: true,
        user_metadata: discordMeta,
      });

      if (!createErr && newUserData.user) {
        const { data: newSignIn, error: newSignInErr } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: derivedPassword,
        });

        if (!newSignInErr && newSignIn.session) {
          return res.status(200).json({
            access_token: newSignIn.session.access_token,
            refresh_token: newSignIn.session.refresh_token,
            discord_username: discordUser.username,
            discord_global_name: discordUser.global_name || null,
            isNew: true,
          });
        }
      }
    }
  }

  // 6. Fallback (no service role key): original signUp path
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: syntheticEmail,
    password: derivedPassword,
    options: { data: discordMeta },
  });

  if (signUpErr) {
    return res.status(500).json({ error: signUpErr.message });
  }

  if (!signUpData.session) {
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
