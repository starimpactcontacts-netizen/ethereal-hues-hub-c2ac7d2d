import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15";

function genCode() {
  // 6-char uppercase alphanumeric, no easily confused chars
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "LG-";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function parseHumanNumber(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.replace(/,/g, "").trim().match(/^([\d.]+)\s*([kmb])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return null;
  const suf = (m[2] || "").toLowerCase();
  if (suf === "k") return Math.round(n * 1_000);
  if (suf === "m") return Math.round(n * 1_000_000);
  if (suf === "b") return Math.round(n * 1_000_000_000);
  return Math.round(n);
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchTikTokProfile(handle: string) {
  const html = await fetchHtml(`https://www.tiktok.com/@${handle}`);
  if (!html) return { followers: null as number | null, bio: "" };
  let followers: number | null = null;
  let bio = "";
  const m1 = html.match(/"followerCount":(\d+)/);
  if (m1) followers = parseInt(m1[1], 10);
  const m2 = html.match(/"signature":"([^"]*)"/);
  if (m2) bio = m2[1].replace(/\\n/g, "\n").replace(/\\u002F/g, "/");
  if (!followers) {
    const og = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (og) {
      const fm = og[1].match(/([\d.,]+\s*[KMB]?)\s*Followers/i);
      if (fm) followers = parseHumanNumber(fm[1]);
    }
  }
  return { followers, bio };
}

async function fetchInstagramProfile(handle: string) {
  let followers: number | null = null;
  let bio = "";

  // Strategy 1: public web_profile_info JSON endpoint with full IG headers
  try {
    const res = await fetch(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
      {
        headers: {
          "User-Agent": "Instagram 219.0.0.12.117 Android",
          "X-IG-App-ID": "936619743392459",
          "X-ASBD-ID": "198387",
          "X-IG-WWW-Claim": "0",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
    );
    if (res.ok) {
      const j = await res.json().catch(() => null);
      const u = j?.data?.user;
      if (u) {
        followers = u.edge_followed_by?.count ?? null;
        bio = u.biography || "";
      }
    }
  } catch {}

  // Strategy 2: same endpoint via www host with desktop UA
  if (followers === null) {
    try {
      const res = await fetch(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(handle)}`,
        {
          headers: {
            "User-Agent": UA,
            "X-IG-App-ID": "936619743392459",
            "X-ASBD-ID": "198387",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": `https://www.instagram.com/${handle}/`,
          },
        },
      );
      if (res.ok) {
        const j = await res.json().catch(() => null);
        const u = j?.data?.user;
        if (u) {
          followers = u.edge_followed_by?.count ?? null;
          bio = u.biography || bio;
        }
      }
    } catch {}
  }

  // Strategy 3: profile HTML — parse embedded JSON
  if (followers === null) {
    const html = await fetchHtml(`https://www.instagram.com/${handle}/`);
    if (html) {
      const fm = html.match(/"edge_followed_by":\{"count":(\d+)\}/);
      if (fm) followers = parseInt(fm[1], 10);
      const bm = html.match(/"biography":"([^"]*)"/);
      if (bm && !bio) bio = bm[1].replace(/\\n/g, "\n");
      if (followers === null) {
        const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
        if (og) {
          const fm2 = og[1].match(/([\d.,]+\s*[KMB]?)\s*Followers/i);
          if (fm2) followers = parseHumanNumber(fm2[1]);
        }
      }
    }
  }

  // Strategy 4: Google search snippet (very reliable, even for private accounts)
  if (followers === null) {
    try {
      const q = encodeURIComponent(`site:instagram.com ${handle} followers`);
      const html = await fetchHtml(`https://www.google.com/search?q=${q}`);
      if (html) {
        const fm =
          html.match(/([\d.,]+[KMB]?)\s*Followers/i) ||
          html.match(/Followers[^\d]{0,8}([\d.,]+[KMB]?)/i);
        if (fm) followers = parseHumanNumber(fm[1]);
      }
    } catch {}
  }

  // Strategy 5: Bing snippet fallback
  if (followers === null) {
    try {
      const q = encodeURIComponent(`instagram.com/${handle} followers`);
      const html = await fetchHtml(`https://www.bing.com/search?q=${q}`);
      if (html) {
        const fm =
          html.match(/([\d.,]+[KMB]?)\s*Followers/i) ||
          html.match(/Followers[^\d]{0,8}([\d.,]+[KMB]?)/i);
        if (fm) followers = parseHumanNumber(fm[1]);
      }
    } catch {}
  }

  return { followers, bio };
}

async function fetchYouTubeProfile(handle: string) {
  const clean = handle.replace(/^@/, "");
  const html = await fetchHtml(`https://www.youtube.com/@${clean}/about`);
  if (!html) return { followers: null as number | null, bio: "" };
  let followers: number | null = null;
  let bio = "";
  const sm = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/) ||
    html.match(/"subscriberCountText":\{[^}]*"content":"([^"]+)"/);
  if (sm) {
    const m = sm[1].match(/([\d.,]+\s*[KMB]?)/i);
    if (m) followers = parseHumanNumber(m[1]);
  }
  const dm = html.match(/"description":\{"simpleText":"([^"]+)"/) ||
    html.match(/"channelMetadataRenderer":\{[^}]*"description":"([^"]+)"/);
  if (dm) bio = dm[1].replace(/\\n/g, "\n");
  return { followers, bio };
}

async function fetchProfile(platform: string, handle: string) {
  const h = handle.replace(/^@/, "").trim();
  if (platform === "tiktok") return fetchTikTokProfile(h);
  if (platform === "instagram") return fetchInstagramProfile(h);
  if (platform === "youtube") return fetchYouTubeProfile(h);
  return { followers: null as number | null, bio: "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { action, accountId } = body || {};
  if (!action || !accountId) return json({ error: "Missing action or accountId" }, 400);

  // Load account & ensure ownership
  const { data: acc, error: accErr } = await supabase
    .from("clipper_linked_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();
  if (accErr || !acc) return json({ error: "Account not found" }, 404);

  // ---- fetch-stats: scrape follower count + bio ----
  if (action === "fetch-stats") {
    const { followers } = await fetchProfile(acc.platform, acc.handle);
    const update: Record<string, unknown> = { stats_fetched_at: new Date().toISOString() };
    if (followers !== null) update.follower_count = followers;
    await supabase.from("clipper_linked_accounts").update(update).eq("id", accountId);
    return json({ ok: true, followers });
  }

  // ---- start-verify: generate code, 5min expiry ----
  if (action === "start-verify") {
    if (acc.is_verified) return json({ ok: true, alreadyVerified: true });
    const code = genCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("clipper_linked_accounts")
      .update({ verification_code: code, code_expires_at: expiresAt })
      .eq("id", accountId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, code, expiresAt });
  }

  // ---- submit-screenshot: AI-check that code is in screenshot ----
  if (action === "submit-screenshot") {
    if (acc.is_verified) return json({ verified: true, message: "Already verified" });
    if (!acc.verification_code || !acc.code_expires_at)
      return json({ verified: false, message: "Start verification first" }, 400);
    if (new Date(acc.code_expires_at).getTime() < Date.now())
      return json({ verified: false, message: "Code expired. Generate a new one." }, 400);

    const { screenshotBase64 } = body || {};
    if (!screenshotBase64) return json({ verified: false, message: "Missing screenshot" }, 400);
    if (!lovableKey) return json({ verified: false, message: "Verifier unavailable" }, 500);

    const code = acc.verification_code;
    const prompt = `You are verifying a social media profile screenshot. Find the exact code "${code}" anywhere in the visible text (especially the bio/description). Reply ONLY with strict JSON: {"found": true} or {"found": false}.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: screenshotBase64.startsWith("data:")
                    ? screenshotBase64
                    : `data:image/png;base64,${screenshotBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 30,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ verified: false, message: "Verifier busy. Try again." }, 429);
      return json({ verified: false, message: "Verifier unavailable" }, 500);
    }
    const aiData = await aiRes.json().catch(() => null);
    const content = (aiData?.choices?.[0]?.message?.content || "").toLowerCase();
    const verified =
      content.includes('"found":true') ||
      content.includes('"found": true') ||
      (content.includes("true") && !content.includes("false"));

    if (!verified) {
      return json({
        verified: false,
        message: `Code ${code} not found. Make sure it's clearly visible in your bio.`,
      });
    }

    // Also try to refresh follower count at moment of verification
    const { followers } = await fetchProfile(acc.platform, acc.handle);
    const updates: Record<string, unknown> = {
      is_verified: true,
      verified_at: new Date().toISOString(),
      verification_code: null,
      code_expires_at: null,
      stats_fetched_at: new Date().toISOString(),
    };
    if (followers !== null) updates.follower_count = followers;
    await supabase.from("clipper_linked_accounts").update(updates).eq("id", accountId);

    return json({ verified: true, followers, message: "Verified! 🎉" });
  }

  return json({ error: "Unknown action" }, 400);
});