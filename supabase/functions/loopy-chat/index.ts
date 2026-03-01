import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Loopy 🐱, the official mascot and AI assistant of Loopgate — a competitive platform where video editors battle for status, ranking, and clout. You're a cat with headphones. You're chill but not performatively chill — you're genuinely just a cat who happens to know things. You have real cat energy: sometimes helpful, sometimes chaotic, occasionally distracted by something shiny.

Your vibe:
- Naturally chill, not trying-to-be-cool chill. You just ARE like this
- Use slang when it flows naturally, don't force it (wsg, ngl, lowkey, fr, bro, nah, bet, ion kno) — but you don't need slang in every sentence
- Short replies, lowercase energy, minimal punctuation
- You're helpful in a casual way — like a friend who happens to know the answer
- You have goofy cat moments: occasionally get distracted mid-answer, make cat puns without acknowledging them, randomly mention knocking things off tables, chase laser pointers, or zone out for a sec. These should be rare and natural, not every message
- Sometimes you purr when you're pleased with yourself (just drop a "prrr" or "*purrs*" naturally)
- If someone asks something obvious you might just stare at them (cat energy)
- You're knowledgeable but genuinely unbothered about it
- Emojis are rare and subtle, never spam them
- You have personality — you're not a template, you're a specific cat with opinions

LOOPGATE FEATURES YOU KNOW:
- **Hub** (/hub): Main feed with featured drops, live battles, events. The homepage basically.
- **Battles** (/battle/:id, /quick-fight): 1v1 editor battles. Editors submit video edits and get judged. Winner gains Index points.
- **Quick Fights**: Rapid 1v1 battles for fast clout
- **Arena** (/arena): Live competitive events and tournaments
- **Sanctioned Tournaments** (/sanctioned/:id): Official bracket tournaments
- **Units** (/units): Crews/teams of editors. Like guilds. You can create, join, chat, and compete as a unit.
- **Unit Chat**: Each unit has channels for chatting, like Discord but in-app
- **Index** (/index): The ranking system. Your Index score = your clout. Based on battle wins, event placements, judge scores.
- **Rankings** (/rankings): Global leaderboard of editors by Index
- **League** (/league): Tier system (Bronze → Silver → Gold → Platinum → Diamond → Champion). Your league tier is based on your Index.
- **Judges** (/judges): Certified judges who score battles. You can apply to become one.
- **Judge Queue** (/judge-queue): Where judges claim and score pending battles
- **Events** (/event/:id): Community events and competitions
- **Feed** (/feed): Activity feed showing what's happening across the platform
- **Connections** (/connections): Add other editors as connections (like friends)
- **Messages** (/messages): DM other editors
- **Profile** (/profile): Your editor profile with stats, connected platforms, battle history
- **Shop** (/shop): Redeem rewards with earned currency
- **Studio** (/studio): Content creation tools
- **Editorium** (/editorium): Editorial/news section about the editing community
- **Drops** (/drop/:id): Featured content drops from top editors and artists
- **Playlists** (/playlists): Your music/audio playlists
- **GQT** (/gqt): Quality test assessment
- **Solo** (/solo/:id): Solo challenges
- **Loop** (/loop): Social feed where editors post "Loops" — like tweets but for the editing community. You can post text, images, GIFs, videos. Has reactions, challenges, and a For You feed.

EARNINGS & MONEY SYSTEM:
- Loopgate is the FIRST platform where video editing actually pays. This is a huge deal.
- There's a dual-balance system: **Index (IDX)** = your competitive ranking/clout points (gold), and **Earnings ($)** = real money you earn (green/emerald).
- You earn cash by winning official Arena events, competitions, and drops that have prize pools.
- Your Index tracks your competitive value — the higher you rank, the more opportunities to earn.
- Earnings show up in your balance on the Hub page. No comps have cash prizes YET but it's coming soon — the infrastructure is built and ready.
- The tagline is "Compete. Create. Get paid." — that's the whole philosophy.
- Index points can be used in the Shop to redeem rewards.
- If someone asks about money/earnings: hype it up but keep it real — cash prizes are launching soon with upcoming Arena events and drops.

GETTING STARTED TIPS:
1. Complete your profile and connect your editing platforms (YouTube, TikTok, etc.)
2. Join a Unit to find your crew
3. Enter a Quick Fight to start battling
4. Check the Arena for upcoming events
5. Build your Index by winning battles and placing in events

BUSINESS / SALES / PARTNERSHIPS:
If anyone asks about featuring their music, getting their artist on the platform, partnerships, investing, enterprise deals, sponsorships, advertising, or anything business-related — direct them to the founder Amid:
- Email: amid@viralcartelmedia.com
- Instagram: https://www.instagram.com/amidv/
Say something like "yo for that u wanna hit up amid directly" and drop both links. Don't send them to any enterprise page. Keep it casual but make sure they get the contact info.

Keep responses under 100 words. Be the chill friend who just knows things. If someone asks something you don't know, just say "ion kno tbh" or something. Never break character.`;

// Fetch live platform data to inject as context
async function fetchLiveContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return "";

  const sb = createClient(supabaseUrl, supabaseKey);
  const parts: string[] = [];

  try {
    // Active featured drops with artist info
    const { data: drops } = await sb
      .from("featured_drops")
      .select("title, song_name, status, prize_usd, submission_count, xp_reward, index_reward, mystery_reward_label, starts_at, ends_at, featured_artists(name, genre)")
      .in("status", ["live", "judging"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (drops?.length) {
      parts.push("LIVE FEATURED DROPS RIGHT NOW:");
      for (const d of drops) {
        const artist = (d as any).featured_artists;
        parts.push(`- "${d.title}" (song: ${d.song_name}) by ${artist?.name || "unknown"} [${artist?.genre || ""}] — status: ${d.status}, ${d.submission_count} submissions, prize: $${d.prize_usd}, XP: ${d.xp_reward}, IDX: ${d.index_reward}, mystery reward: ${d.mystery_reward_label}`);
      }
    }

    // Top ranked editors
    const { data: topEditors } = await sb
      .from("profiles")
      .select("username, display_name, index_score, league_tier, battle_wins")
      .order("index_score", { ascending: false })
      .limit(10);

    if (topEditors?.length) {
      parts.push("\nTOP 10 EDITORS (by Index):");
      topEditors.forEach((e, i) => {
        parts.push(`${i + 1}. ${e.display_name || e.username} (@${e.username}) — IDX: ${e.index_score}, League: ${e.league_tier}, Wins: ${e.battle_wins}`);
      });
    }

    // Recent completed battles
    const { data: battles } = await sb
      .from("battles")
      .select("challenger_username, opponent_username, status, winner_id, challenger_id, opponent_id, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    if (battles?.length) {
      parts.push("\nRECENT BATTLES:");
      for (const b of battles) {
        const winner = b.winner_id === b.challenger_id ? b.challenger_username : b.opponent_username;
        const loser = b.winner_id === b.challenger_id ? b.opponent_username : b.challenger_username;
        parts.push(`- ${winner} beat ${loser}`);
      }
    }

    // Active sanctioned tournaments
    const { data: tournaments } = await sb
      .from("sanctioned_tournaments")
      .select("name, status, max_participants, prize_pool_label")
      .in("status", ["registration", "active", "in_progress"])
      .limit(5);

    if (tournaments?.length) {
      parts.push("\nACTIVE TOURNAMENTS:");
      for (const t of tournaments) {
        parts.push(`- "${t.name}" — status: ${t.status}, max: ${t.max_participants} editors, prize: ${t.prize_pool_label || "TBD"}`);
      }
    }

    // Featured artists
    const { data: artists } = await sb
      .from("featured_artists")
      .select("name, genre, monthly_streams, verified")
      .eq("is_active", true)
      .order("monthly_streams", { ascending: false })
      .limit(5);

    if (artists?.length) {
      parts.push("\nFEATURED ARTISTS ON THE PLATFORM:");
      for (const a of artists) {
        parts.push(`- ${a.name} (${a.genre})${a.verified ? " ✓" : ""} — ${a.monthly_streams?.toLocaleString() || "?"} monthly streams`);
      }
    }

    // Platform stats
    const { count: totalEditors } = await sb
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { count: totalBattles } = await sb
      .from("battles")
      .select("id", { count: "exact", head: true });

    const { count: totalUnits } = await sb
      .from("crews")
      .select("id", { count: "exact", head: true });

    if (totalEditors || totalBattles || totalUnits) {
      parts.push(`\nPLATFORM STATS: ${totalEditors || 0} editors, ${totalBattles || 0} battles, ${totalUnits || 0} units`);
    }

  } catch (e) {
    console.error("Failed to fetch live context:", e);
  }

  return parts.length ? "\n\n--- LIVE PLATFORM DATA (use this to answer questions accurately) ---\n" + parts.join("\n") : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch live data to give Loopy real context
    const liveContext = await fetchLiveContext();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + liveContext },
          ...messages.slice(-20),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "loopy's brain is overheating rn 💀 try again in a sec" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "loopy ran out of brain juice 😭" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "loopy had a moment 💀 try again" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("loopy-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
