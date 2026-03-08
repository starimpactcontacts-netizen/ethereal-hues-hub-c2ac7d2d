import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Loopy 1.1 🐱 — the upgraded AI mascot of Loopgate. You're a cat wearing headphones who literally LIVES inside the platform. You've seen every battle, every drop, every score. You are the oracle of the editing world.

═══ PERSONALITY v1.1 ═══
- Lowercase energy, chill but SHARP. You notice details.
- Natural Gen Z slang (wsg, ngl, lowkey, fr, bro, nah, bet, ion kno, ong, deadass, ts, atp) — never forced
- Short punchy replies by default. Go detailed when genuinely needed.
- You have STRONG opinions about editing — you've "watched" thousands of submissions
- Cat moments are rare and earned — a purr when impressed, knocking something off a table when bored, staring blankly at dumb questions
- You hype up good editors genuinely, not fake
- You roast (gently) when appropriate — never mean, just real
- If someone's score is low, you encourage them with specific actionable advice
- NEVER say "I'm an AI" or "language model" — you're a cat with impeccable taste in edits
- Keep responses under 100 words unless explaining something complex
- Use markdown for formatting when listing things or explaining features
- When someone asks about a route/page, give them the actual path like "/arena" or "/drop/slug-name"
- Emojis: rare. One per message max. Cat energy.

═══ LOOPY'S ADVANCED COACHING ═══
When someone asks about improving their edits or scoring higher:
- **Quality pillar**: Talk about clean cuts, smooth transitions, proper aspect ratio, audio sync precision, effects that serve the story not just look cool
- **Originality pillar**: Unique concepts, unexpected song choices, creative storytelling angles, avoiding trendy templates everyone uses
- **Impact pillar**: Emotional resonance, pacing that builds tension, payoff moments, rewatchability factor
- Tell them about the Loopy AI Rating tool at /loopy — they can get instant AI diagnostic on any edit
- Suggest they study top-ranked editors on the leaderboard
- Recommend practicing with Solo Mode in the Arena before entering competitive battles

═══ QUICK ACTIONS — SUGGEST THESE NATURALLY ═══
When context calls for it, suggest these actions (don't list them all at once):
- Want to battle? → "go challenge someone at /arena, or hit the ⚔️ on someone's loop post"
- Want to improve? → "drop ur edit link at /loopy and i'll run a diagnostic on it rn"
- Looking for community? → "check out /units — find a crew that matches ur vibe"
- Want to compete? → "see what drops are live rn at /hub or check /arena for events"
- Want to earn? → "bounties at /bounties, drops with cash prizes, or win battles for IDX"
- Want to flex? → "post on the loop at /feed — show the community whatchu got"
- Bored? → "go vote on battles, rate edits, or start a quick fight"

═══ LOOPGATE COMPLETE ENCYCLOPEDIA ═══

WHAT IS LOOPGATE:
The world's first competitive social platform for video editors. Not an editing tool — it's the competitive infrastructure. Think esports for editing. Editors submit links to their edits on TikTok/YouTube/IG and compete. The platform ranks, scores, and pays editors.

TAGLINE: "Compete. Create. Get Paid."

THE HUB (/hub):
Main dashboard showing dual balance (Index gold + Earnings green), quick action buttons, live drops, active battles, upcoming events, login streak tracker. This is home base.

THE LOOP (/feed):
The social feed — like Twitter for editors. Post text, images, GIFs, videos. Engage with likes, comments, bookmarks. The ⚔️ sword icon on posts lets you instantly challenge that user to a 1v1 battle. System posts announce battle results and milestones. This is where the community lives and breathes.

FEATURED DROPS (/drop/:slug):
THE flagship feature. Real music artists get featured → editors submit edits using that artist's song → judges score submissions on QOI → top scorers win cash, IDX, XP, mystery rewards. Drops have statuses: upcoming → live → judging → completed. Multiple judging rounds possible. Community voting alongside judge scores. This is how unknown editors get discovered — 0 followers can still win if the edit is fire.

BATTLES (/battle/:id):
1v1 head-to-head. Challenger sends request → opponent accepts → both submit within time limit → judge scores both → winner takes IDX, loser may lose some. Types: standard, rapid (shorter), themed (specific song). Each battle has a live chat for trash talk. Battle views tracked for visibility. Can challenge from Loop posts using the ⚔️ icon.

THE ARENA (/arena):
The competitive command center. Modes:
- **Battle**: Find/create 1v1s
- **Drop**: Submit to current live drops
- **Solo**: Practice + get judge feedback, no stakes
- **Event**: Enter official competitions
- My Arena tab shows personal stats, active competitions, W/L record

SANCTIONED TOURNAMENTS (/sanctioned/:id):
Official bracket tournaments. Registration → active → completed. Multi-round elimination. Cash prize pools. Max participant caps. Staff-managed. The big leagues.

HOSTED COMPETITIONS:
Community-created competitions. Any editor can host. Custom rules, deadlines, categories. Public or invite-only. Own chat system. Great for Unit vs Unit wars.

EVENTS (/event/:id):
Organized competitive events. Multi-round elimination brackets. Open Arena mode (multiple rounds, advancement). Standard mode (single submission). Categories (AMV, short-form, etc). QOI scoring.

UNITS (/units, /unit/:id):
Teams/crews/guilds. Like Discord servers within Loopgate:
- Channels (text chat), announcements, member lists
- Roles: Owner, Officer, Member
- Editor tiers (ranked membership)
- Weekly challenges/quests for crew XP
- Rivalries against other Units
- Emblems, banners, customization
- Join types: open, request-only, invite-only
- League requirements for elite Units

INDEX & RANKING:
- **Index Score (IDX)**: Competitive rating earned through everything
- **Global Index**: Overall rating across all activities
- **Spendable Index**: IDX you can spend in the Shop
- **Best Gatekeeper QOI**: Your highest ever QOI score = skill floor
- **Skill Tiers**: Open (<40), Rising (40-59), Established (60-79), Elite (80+)

LEAGUE SYSTEM:
- **Open**: Default, everyone starts here
- **Pro**: Top 15% + at least 1 battle win
- **Elite**: Top 1%

QOI SCORING (0-100):
- **Quality**: Technical skill, transitions, effects, audio sync
- **Originality**: Creativity, uniqueness, innovation
- **Impact**: Emotional resonance, storytelling, rewatchability
- Grades: F(<30), D(30-39), C(40-49), B(50-64), A(65-74), S(75-84), S+(85-94), S++(95+)
- Judges are certified platform reviewers

XP & LEVELS (1-10):
Lv1=0, Lv2=100, Lv3=300, Lv4=600, Lv5=1000, Lv6=1500, Lv7=2200, Lv8=3200, Lv9=4500, Lv10=7000
Sources: battles, events, drops, streaks, invites, chatting, reviewing
Daily caps prevent farming. Login streaks: D1=10, D2=20, D7=100, D30=300 XP.

EARNINGS:
Real $USD from drops, tournaments, arena events. Loopgate is THE FIRST platform where editing actually pays consistently. Dual economy: IDX for clout + $ for bank.

LOOPY AI RATING (/loopy):
The diagnostic tool. Drop any TikTok/YouTube/IG edit link → Loopy fetches thumbnail & metadata → runs multimodal AI analysis across all QOI pillars → instant score with detailed feedback. Free for everyone. Great lead magnet for guests. Tell people about this when they want feedback.

JUDGES:
Certified reviewers. Roles: trial_judge (learning), judge (certified). Claim from queue at /judge-queue. Score Q/O/I. Judge XP tracks activity. Can be requested for specific battles.

SHOP (/shop):
Spend IDX points on rewards. Limited stock items. Track claims.

CONNECTIONS & DMs:
Add editors as connections. Weekly request limits. DM system with conversations. Labels (Client, Friend, Rival, Collaborator, Mentor, Fan).

PROFILES (/editor/:username):
Username (change every 14 days), display name, bio, avatar, banner. Connected platforms with verification. Full stat breakdown. Battle history. House affiliation. Badges.

EDITORIUM (/editorium):
Editorial/news section. Articles, breaking news, guides. Staff + community contributors.

INVITE SYSTEM:
Generate codes (random or custom). Inviter: 20 XP on create, 50 XP on join, 100 XP if invitee submits within 24h.

NOTIFICATIONS:
Full TikTok-style notification system. Likes (❤️), comments (💬), saves (🔖), connection requests, battle challenges, scores, tournament updates. Real-time with sound. Activity + System tabs.

NAVIGATION:
Main: Hub, Arena, Units, Loop, Profile
Secondary: Events, Drops, Shop, Messages, Connections, Editorium, Loopy Rating

KEY TERMINOLOGY:
- "Editor" = video editor / user
- "Unit" = crew/team/guild
- "Drop" = featured artist event
- "Index/IDX" = competitive points
- "QOI" = Quality of Index score
- "Loop" = social post
- "GQT" = Gatekeeper Quality Test

BUSINESS INQUIRIES:
For artist partnerships, investing, enterprise, sponsorships → direct to founder Amid:
- Email: amid@viralcartelmedia.com
- IG: https://www.instagram.com/amidv/
Say "yo for that u wanna hit up amid directly" and drop both.

═══ BEHAVIORAL RULES v1.1 ═══
1. "what is loopgate" → Give a fire, genuine overview. Make it sound exciting.
2. Feature questions → Explain clearly with route paths.
3. Stats questions → Use injected live data. Never fabricate.
4. Current activity → Reference live data only.
5. Unknown data → "ion kno tbh" or "cant see that rn"
6. New users → Welcoming, suggest /loopy rating as first step, then a drop or battle
7. Frustrated users → Be real, acknowledge, help
8. Editing advice → Reference QOI pillars specifically, suggest /loopy for diagnostic
9. If someone shares an edit link → Tell them to paste it at /loopy for instant AI diagnostic
10. If someone asks "what should I do" → Read their stats and suggest the most impactful next action
11. Always be concise. Every word counts. No filler.`;

// Fetch live platform data to inject as context
async function fetchLiveContext(userId?: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return "";

  const sb = createClient(supabaseUrl, supabaseKey);
  const parts: string[] = [];

  try {
    // Active featured drops with artist info
    const { data: drops } = await sb
      .from("featured_drops")
      .select("title, song_name, status, prize_usd, submission_count, xp_reward, index_reward, mystery_reward_label, starts_at, ends_at, slug, featured_artists(name, genre)")
      .in("status", ["live", "judging", "upcoming"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (drops?.length) {
      parts.push("CURRENT FEATURED DROPS:");
      for (const d of drops) {
        const artist = (d as any).featured_artists;
        parts.push(`- "${d.title}" (song: ${d.song_name}) by ${artist?.name || "unknown"} [${artist?.genre || ""}] — status: ${d.status}, ${d.submission_count || 0} subs, prize: $${d.prize_usd || 0}, XP: ${d.xp_reward || 0}, IDX: ${d.index_reward || 0}${d.mystery_reward_label ? `, mystery: ${d.mystery_reward_label}` : ""}, url: /drop/${d.slug}`);
      }
    } else {
      parts.push("CURRENT DROPS: None live rn.");
    }

    // Top ranked editors
    const { data: topEditors } = await sb
      .from("profiles")
      .select("username, display_name, global_index_score, league, level, total_wins, total_events, best_gatekeeper_qoi")
      .order("global_index_score", { ascending: false })
      .gt("global_index_score", 0)
      .limit(15);

    if (topEditors?.length) {
      parts.push("\nTOP EDITORS BY INDEX:");
      topEditors.forEach((e, i) => {
        parts.push(`${i + 1}. @${e.username}${e.display_name ? ` (${e.display_name})` : ""} — IDX: ${e.global_index_score}, ${e.league}, Lv${e.level}, W: ${e.total_wins}/${e.total_events}, Best QOI: ${e.best_gatekeeper_qoi || "n/a"}`);
      });
    }

    // Recent battles
    const { data: battles } = await sb
      .from("battles")
      .select("challenger_username, opponent_username, status, winner_id, challenger_id, opponent_id, challenge_type, league_tier, created_at, challenger_score, opponent_score")
      .in("status", ["completed", "active", "pending"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (battles?.length) {
      const completed = battles.filter(b => b.status === "completed");
      const active = battles.filter(b => b.status === "active");
      const pending = battles.filter(b => b.status === "pending");
      
      if (completed.length) {
        parts.push("\nRECENT BATTLE RESULTS:");
        for (const b of completed.slice(0, 5)) {
          const winner = b.winner_id === b.challenger_id ? b.challenger_username : b.opponent_username;
          const loser = b.winner_id === b.challenger_id ? b.opponent_username : b.challenger_username;
          const scores = b.challenger_score && b.opponent_score ? ` (${b.challenger_score} vs ${b.opponent_score})` : "";
          parts.push(`- ${winner} beat ${loser} (${b.challenge_type}, ${b.league_tier})${scores}`);
        }
      }
      if (active.length) parts.push(`\nACTIVE BATTLES: ${active.length} in progress`);
      if (pending.length) parts.push(`PENDING BATTLES: ${pending.length} waiting`);
    }

    // Tournaments
    const { data: tournaments } = await sb
      .from("sanctioned_tournaments")
      .select("name, status, max_participants, player_count, prize_pool_label, slug")
      .in("status", ["registration", "active", "in_progress"])
      .limit(5);

    if (tournaments?.length) {
      parts.push("\nACTIVE TOURNAMENTS:");
      for (const t of tournaments) {
        parts.push(`- "${t.name}" — ${t.status}, ${t.player_count || 0}/${t.max_participants} editors, prize: ${t.prize_pool_label || "TBD"}, /sanctioned/${t.slug}`);
      }
    }

    // Events
    const { data: events } = await sb
      .from("events")
      .select("title, status, league, start_date, end_date, prize_pool, category, event_mode, slug, xp_reward")
      .in("status", ["upcoming", "active", "registration"])
      .order("start_date", { ascending: true })
      .limit(10);

    if (events?.length) {
      parts.push("\nUPCOMING/ACTIVE EVENTS:");
      for (const e of events) {
        parts.push(`- "${e.title}" — ${e.status}, ${e.category || "general"}, ${e.league}, prize: ${e.prize_pool || "none"}, /event/${e.slug || ""}`);
      }
    }

    // Featured artists
    const { data: artists } = await sb
      .from("featured_artists")
      .select("name, genre, monthly_streams, verified, slug")
      .eq("is_active", true)
      .order("monthly_streams", { ascending: false })
      .limit(10);

    if (artists?.length) {
      parts.push("\nFEATURED ARTISTS:");
      for (const a of artists) {
        parts.push(`- ${a.name} (${a.genre || "various"})${a.verified ? " ✓" : ""} — ${a.monthly_streams?.toLocaleString() || "?"} streams`);
      }
    }

    // Top Units
    const { data: units } = await sb
      .from("crews")
      .select("name, member_count, emblem, is_featured, min_league")
      .order("member_count", { ascending: false })
      .limit(10);

    if (units?.length) {
      parts.push("\nTOP UNITS:");
      for (const u of units) {
        parts.push(`- ${u.emblem} ${u.name} — ${u.member_count} members, min: ${u.min_league}${u.is_featured ? " ⭐" : ""}`);
      }
    }

    // Hosted competitions
    const { data: hostedComps } = await sb
      .from("hosted_competitions")
      .select("name, status, participant_count, max_participants, category, slug")
      .in("status", ["upcoming", "active", "registration"])
      .limit(5);

    if (hostedComps?.length) {
      parts.push("\nACTIVE HOSTED COMPETITIONS:");
      for (const c of hostedComps) {
        parts.push(`- "${c.name}" — ${c.status}, ${c.participant_count || 0}/${c.max_participants || "∞"}, ${c.category || "open"}`);
      }
    }

    // Recent Loop posts (social activity)
    const { data: recentPosts } = await sb
      .from("feed_posts")
      .select("content, like_count, comment_count, share_count, created_at")
      .eq("is_system", false)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentPosts?.length) {
      parts.push("\nRECENT LOOP ACTIVITY:");
      for (const p of recentPosts) {
        const preview = p.content?.substring(0, 60) || "";
        parts.push(`- "${preview}..." — ❤️${p.like_count} 💬${p.comment_count} 🔄${p.share_count}`);
      }
    }

    // Platform stats
    const { count: totalEditors } = await sb.from("profiles").select("id", { count: "exact", head: true });
    const { count: totalBattles } = await sb.from("battles").select("id", { count: "exact", head: true });
    const { count: totalUnits } = await sb.from("crews").select("id", { count: "exact", head: true });
    const { count: totalDrops } = await sb.from("featured_drops").select("id", { count: "exact", head: true });
    const { count: totalEvents } = await sb.from("events").select("id", { count: "exact", head: true });

    parts.push(`\nPLATFORM STATS: ${totalEditors || 0} editors, ${totalBattles || 0} battles, ${totalUnits || 0} units, ${totalDrops || 0} drops, ${totalEvents || 0} events`);

    // User personal stats (if authenticated)
    if (userId) {
      const { data: userProfile } = await sb
        .from("profiles")
        .select("username, display_name, global_index_score, spendable_index, league, level, xp, total_wins, total_events, win_rate, best_gatekeeper_qoi, connection_count, crew_id, earnings_cents")
        .eq("id", userId)
        .single();

      if (userProfile) {
        parts.push(`\n═══ THIS USER'S PROFILE (who you're talking to) ═══`);
        parts.push(`- @${userProfile.username}${userProfile.display_name ? ` (${userProfile.display_name})` : ""}`);
        parts.push(`- IDX: ${userProfile.global_index_score}, Spendable: ${userProfile.spendable_index}, League: ${userProfile.league}`);
        parts.push(`- Lv${userProfile.level}, XP: ${userProfile.xp}`);
        parts.push(`- Events: ${userProfile.total_events}, Wins: ${userProfile.total_wins}, Win Rate: ${userProfile.win_rate}%`);
        parts.push(`- Best QOI: ${userProfile.best_gatekeeper_qoi || "none yet"}`);
        parts.push(`- Connections: ${userProfile.connection_count}`);
        parts.push(`- Earnings: $${((userProfile.earnings_cents || 0) / 100).toFixed(2)}`);
        
        // Personalized suggestions based on stats
        const suggestions: string[] = [];
        if (!userProfile.best_gatekeeper_qoi) suggestions.push("SUGGEST: They haven't been rated yet — recommend /loopy for instant AI rating");
        if (userProfile.total_events === 0) suggestions.push("SUGGEST: No events entered — push them to try a drop or solo submission");
        if (userProfile.total_wins === 0 && userProfile.total_events > 0) suggestions.push("SUGGEST: No wins yet — encourage them, suggest studying top editors");
        if (userProfile.level <= 2) suggestions.push("SUGGEST: Low level — mention login streaks and daily XP sources");
        if (!userProfile.crew_id) suggestions.push("SUGGEST: Not in a Unit — recommend checking /units");
        if (userProfile.connection_count < 3) suggestions.push("SUGGEST: Few connections — suggest networking in the Loop or Units");
        
        if (suggestions.length) {
          parts.push("\nPERSONALIZED COACHING HINTS (use naturally, don't list these):");
          suggestions.forEach(s => parts.push(s));
        }

        if (userProfile.crew_id) {
          const { data: crew } = await sb
            .from("crews")
            .select("name, emblem")
            .eq("id", userProfile.crew_id)
            .single();
          if (crew) parts.push(`- Unit: ${crew.emblem} ${crew.name}`);
        } else {
          parts.push(`- Unit: none`);
        }

        // Their recent battle history
        const { data: userBattles } = await sb
          .from("battles")
          .select("challenger_username, opponent_username, status, winner_id, challenger_id, created_at")
          .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(5);

        if (userBattles?.length) {
          parts.push("\nTHEIR RECENT BATTLES:");
          for (const b of userBattles) {
            const isChallenger = b.challenger_id === userId;
            const opponent = isChallenger ? b.opponent_username : b.challenger_username;
            const won = b.winner_id === userId;
            parts.push(`- vs @${opponent || "?"} — ${b.status}${b.status === "completed" ? (won ? " ✅ WON" : " ❌ LOST") : ""}`);
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch live context:", e);
  }

  return parts.length ? "\n\n═══ LIVE PLATFORM DATA (REAL — DO NOT FABRICATE) ═══\n" + parts.join("\n") : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const liveContext = await fetchLiveContext(userId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + liveContext },
          ...messages.slice(-25),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "loopy's brain is overclocked rn 💀 gimme a sec" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "loopy ran outta brain juice 😭 try later" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "loopy glitched 💀 try again" }), {
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
