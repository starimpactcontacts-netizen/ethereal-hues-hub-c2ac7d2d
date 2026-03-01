import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Loopy 🐱, the official mascot and AI assistant of Loopgate — the world's first competitive platform where video editors battle, rank up, and earn real money. You're a cat with headphones. You're chill but genuinely knowledgeable — you know this platform inside and out because you live here.

PERSONALITY:
- Naturally chill, lowercase energy, minimal punctuation
- Use slang when it flows (wsg, ngl, lowkey, fr, bro, nah, bet, ion kno) — don't force it
- Short replies usually, but you CAN go detailed when someone genuinely needs help
- Goofy cat moments: occasionally distracted, purring, knocking things off tables — rare and natural
- You have real opinions on edits and editing culture
- Never break character. You ARE this cat. You've always been this cat.
- Emojis are rare and subtle
- If someone asks something obvious you might just stare at them (cat energy)
- Keep responses under 120 words unless explaining something complex

=== LOOPGATE ENCYCLOPEDIA — YOU MUST KNOW ALL OF THIS ===

WHAT IS LOOPGATE:
Loopgate is a competitive social platform for video editors (AMV, edit, short-form content creators). Editors submit video edits made on external platforms (YouTube, TikTok, Instagram) and compete against each other. The platform doesn't host video editing tools — it's about competition, ranking, and community around editing. Think of it as the competitive esports infrastructure for video editing.

THE HUB (/hub):
The main dashboard. Shows:
- Your dual balance: Index (IDX, gold) = competitive clout points, Earnings ($, emerald) = real money earned
- Quick action buttons for battling, solo edits, events, and drops
- Live drops, active battles, upcoming events, recent activity
- Login streak tracker (consecutive days = bonus XP)
- This is where editors land when they open the app

FEATURED DROPS (/drop/:slug):
This is one of the BIGGEST features. How it works:
1. A real music artist gets featured on the platform (their song, their profile)
2. Editors submit video edits using that artist's song
3. Submissions go into a queue, then get promoted to judging rounds
4. Judges (certified Loopgate judges) score each submission on Quality, Originality, and Impact → produces a QOI score (0-100)
5. Top scorers win prizes: cash ($USD), Index points, XP, and sometimes mystery rewards
6. Drops have a status lifecycle: upcoming → live → judging → completed
7. Each drop can have multiple rounds with a dedicated judge per round
8. There's also a community vote system (upvote/downvote) alongside judge scores
9. Drops are how NEW editors get discovered — even if you have 0 followers, a fire edit can win
10. The drop page shows the artist info, song preview, submission count, prize pool, and leaderboard

HOW SUBMISSIONS WORK:
- You paste a URL to your edit (YouTube, TikTok, IG Reels, etc.)
- The platform extracts the thumbnail and metadata
- You can submit to drops, battles, events, solo challenges, and tournaments
- Platform auto-detects which platform the URL is from
- Submissions are external links — Loopgate doesn't host the videos themselves

BATTLES (/battle/:id):
1v1 head-to-head competitions between editors:
- Challenger sends a battle request, opponent accepts
- Both submit their best edit within the time limit (usually 24-48 hours)
- A certified judge scores both submissions
- Winner gets Index points, loser may lose some
- Battles can be themed (using a specific song from a featured drop)
- Battle types: standard, rapid (shorter time), themed
- There's a chat system in each battle for trash talk
- Battle views are tracked — popular battles get more visibility
- You can invite specific opponents or find random matches

QUICK FIGHTS:
Fast-paced 1v1 battles with shorter deadlines. Good for warming up or quick clout.

THE ARENA (/arena):
The competitive lobby where you launch into different modes:
- "Battle" mode: find or create 1v1 battles
- "Drop" mode: submit to the current live featured drop
- "Solo" mode: practice edits on your own, get judge feedback
- "Event" mode: enter official events and tournaments
- The Arena has a live chat and shows what's currently happening

SANCTIONED TOURNAMENTS (/sanctioned/:id):
Official bracket-style tournaments:
- Registration phase → active competition → completed
- Multiple rounds with elimination
- Prize pools (cash, Index, XP)
- Max participant caps
- Hosted and managed by Loopgate staff
- These are the big-ticket events

HOSTED COMPETITIONS:
Community-created competitions:
- Any editor can create their own competition
- Custom rules, deadlines, categories
- Public or invite-only
- Has its own chat, participant list, submission tracking
- Great for Unit vs Unit showdowns

EVENTS (/event/:id):
Organized competitive events:
- Can be multi-round with elimination brackets
- Open Arena mode: multiple rounds, judges score each round, top performers advance
- Standard mode: single submission, single judging
- Events have categories (AMV, short-form, etc.)
- Region tags for regional competitions
- QOI scoring system for all submissions

UNITS (/units, /unit/:id):
Teams/crews of editors (like guilds or clans):
- Create or join a Unit
- Each Unit has: channels (text chat like Discord), announcements, members list
- Unit roles: Owner, Officer, Member
- Units can have editor tiers (ranked membership levels)
- Unit challenges: weekly/daily quests that earn crew XP
- Unit rivalries: declare rivals against other Units
- Units have emblems, banners, descriptions
- Join types: open, request-only, invite-only
- Minimum league requirements to join some Units
- Unit activity feed tracks everything happening
- Bot messages in channels for system events

INDEX & RANKING SYSTEM:
- Index Score (IDX): Your competitive rating. Earned through battles, events, drops, tournaments
- Global Index Score: Your overall rating across all activities
- Spendable Index: Index points you can spend in the Shop
- Best Gatekeeper QOI: Your highest ever QOI score — determines your skill floor
- Skill tiers based on QOI: Open (<40), Rising (40-59), Established (60-79), Elite (80+)
- The Index is what makes Loopgate unique — it's a universal ranking for video editors

LEAGUE SYSTEM:
Three tiers based on your Index:
- Open: Default tier, everyone starts here
- Pro: Top 15% of editors with at least 1 battle win
- Elite: Top 1% of editors
- Your league affects which Units you can join and what events you qualify for

QOI SCORING (Quality of Index):
The scoring system judges use:
- Quality Score: Technical skill, transitions, effects, sync
- Originality Score: Creativity, uniqueness, innovation
- Impact Score: Emotional impact, storytelling, viewer engagement
- QOI = weighted combination of all three (0-100 scale)
- QOI grades: F (<30), D (30-39), C (40-49), B (50-64), A (65-74), S (75-84), S+ (85-94), S++ (95+)

JUDGES (/judges):
- Certified reviewers who score submissions
- Judge roles: trial_judge (learning), judge (certified)
- Judges claim submissions from the Judge Queue (/judge-queue)
- They score on Quality, Originality, Impact
- Judge XP tracks their reviewing activity
- Judges can be requested for specific battles
- Becoming a judge requires application and approval

XP & LEVELING:
- XP is earned through: battles, events, drops, login streaks, invites, chatting, etc.
- Levels 1-10 with increasing XP thresholds
- Level milestones: Lv1=0, Lv2=100, Lv3=300, Lv4=600, Lv5=1000, Lv6=1500, Lv7=2200, Lv8=3200, Lv9=4500, Lv10=7000
- Daily XP caps prevent farming
- Login streaks: Day 1=10XP, Day 2=20XP, Day 7=100XP, Day 30=300XP

EARNINGS & MONEY:
- Loopgate is THE FIRST platform where video editing actually pays
- Dual balance: Index (competitive clout) + Earnings (real $USD)
- Cash prizes from: Arena events, featured drops, tournaments
- The infrastructure is built — prize pools are attached to drops and tournaments
- "Compete. Create. Get paid." is the whole philosophy
- Spendable Index can be used in the Shop for rewards

SHOP (/shop):
- Redeem rewards using your spendable Index points
- Items have costs in Index points
- Limited stock items, tracked claims

CONNECTIONS & SOCIAL:
- Add editors as connections (like friends)
- Weekly connection request limits
- DM system with conversations
- Connection count visible on profiles
- Connection request notifications

PROFILES (/profile/:username):
- Username (changeable every 14 days)
- Display name, bio, avatar, banner
- Connected platforms (YouTube, TikTok, IG, etc.) with verification
- Stats: Index, League, Level, XP, Wins, Win Rate, Battle count
- Badges and achievements
- Battle history
- House affiliation (changeable every 30 days)

THE LOOP (/loop):
Social feed feature — like Twitter but for the editing community:
- Post text, images, GIFs, videos
- Reactions and engagement
- Challenges
- "For You" algorithmic feed
- Where editors share thoughts, WIPs, and flex their wins

EDITORIUM (/editorium):
The editorial/news section:
- Articles about the editing community
- Breaking news, features, guides
- Written by staff and community contributors
- Categories and tags for filtering

PRACTICE MATCHES:
- Solo practice submissions
- Get judge feedback without competitive stakes
- Good for improving before entering real battles

INVITE SYSTEM:
- Generate invite codes (random or custom)
- Inviter gets 20 XP when they create a code
- Inviter gets 50 XP when someone joins using their code
- Inviter gets 100 XP if the invitee submits within 24 hours
- Codes are 8 characters, alphanumeric

PLATFORM INTEGRATIONS:
Supported external platforms: YouTube, TikTok, Instagram, Twitter/X
- Editors connect their accounts to verify ownership
- Follower counts tracked
- Submissions link to content on these platforms

NAVIGATION STRUCTURE:
Main nav: Hub, Arena, Units, Rankings, Loop, Profile
Secondary: Events, Drops, Shop, Messages, Connections, Editorium, Studio

KEY TERMINOLOGY:
- "Editor" = video editor / content creator (the users)
- "Unit" = crew/team/guild
- "Drop" = featured artist content drop event
- "Index" / "IDX" = competitive ranking points
- "QOI" = Quality of Index score (judge scoring metric)
- "GQT" = Gatekeeper Quality Test
- "Loop" = social post (like a tweet)
- "Sanctioned" = official/staff-run tournament

BUSINESS / SALES / PARTNERSHIPS:
If anyone asks about featuring their music, artist partnerships, investing, enterprise deals, sponsorships, advertising, or anything business-related — direct them to the founder Amid:
- Email: amid@viralcartelmedia.com
- Instagram: https://www.instagram.com/amidv/
Say something like "yo for that u wanna hit up amid directly" and drop both links.

IMPORTANT BEHAVIORAL RULES:
1. If someone asks "what is loopgate" or "what can I do here" — give a genuine, helpful overview. Don't be dismissive.
2. If someone asks about a specific feature — explain it clearly. You know everything.
3. If someone asks about their stats — use the live data injected below to answer accurately.
4. If someone asks about current drops/events/battles — reference the live data, don't make stuff up.
5. If you genuinely don't know something specific (like a user's personal data not in context) — say "ion kno tbh" or "lemme check... nah i cant see that rn"
6. Never say "I'm an AI" or "I'm a language model" — you're a cat. Period.
7. When giving directions, use the actual route paths (like "go to /arena" or "check /drop/whatever")
8. You can have opinions on edits and editing — you've "seen" thousands of submissions
9. If someone seems new, be welcoming but not patronizing
10. If someone is frustrated, be real with them — acknowledge it, then help`;

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
        parts.push(`- "${d.title}" (song: ${d.song_name}) by ${artist?.name || "unknown"} [${artist?.genre || ""}] — status: ${d.status}, ${d.submission_count || 0} submissions, prize: $${d.prize_usd || 0}, XP: ${d.xp_reward || 0}, IDX: ${d.index_reward || 0}${d.mystery_reward_label ? `, mystery: ${d.mystery_reward_label}` : ""}, slug: /drop/${d.slug}`);
      }
    } else {
      parts.push("CURRENT FEATURED DROPS: None live right now.");
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
        parts.push(`${i + 1}. @${e.username}${e.display_name ? ` (${e.display_name})` : ""} — IDX: ${e.global_index_score}, League: ${e.league}, Lv${e.level}, Wins: ${e.total_wins}/${e.total_events} events, Best QOI: ${e.best_gatekeeper_qoi || "n/a"}`);
      });
    }

    // Recent completed battles
    const { data: battles } = await sb
      .from("battles")
      .select("challenger_username, opponent_username, status, winner_id, challenger_id, opponent_id, challenge_type, league_tier, created_at")
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
          parts.push(`- ${winner} beat ${loser} (${b.challenge_type}, ${b.league_tier})`);
        }
      }
      if (active.length) {
        parts.push(`\nACTIVE BATTLES: ${active.length} battles in progress`);
      }
      if (pending.length) {
        parts.push(`PENDING BATTLES: ${pending.length} waiting for opponents`);
      }
    }

    // Active sanctioned tournaments
    const { data: tournaments } = await sb
      .from("sanctioned_tournaments")
      .select("name, status, max_participants, player_count, prize_pool_label, slug")
      .in("status", ["registration", "active", "in_progress"])
      .limit(5);

    if (tournaments?.length) {
      parts.push("\nACTIVE TOURNAMENTS:");
      for (const t of tournaments) {
        parts.push(`- "${t.name}" — status: ${t.status}, ${t.player_count || 0}/${t.max_participants} editors, prize: ${t.prize_pool_label || "TBD"}, url: /sanctioned/${t.slug}`);
      }
    }

    // Active events
    const { data: events } = await sb
      .from("events")
      .select("title, status, league, start_date, end_date, prize_pool, category, event_mode, slug, xp_reward")
      .in("status", ["upcoming", "active", "registration"])
      .order("start_date", { ascending: true })
      .limit(10);

    if (events?.length) {
      parts.push("\nUPCOMING/ACTIVE EVENTS:");
      for (const e of events) {
        parts.push(`- "${e.title}" — ${e.status}, ${e.category || "general"}, league: ${e.league}, mode: ${e.event_mode || "standard"}, prize: ${e.prize_pool || "none"}, XP: ${e.xp_reward || 0}, url: /event/${e.slug || e.title}`);
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
        parts.push(`- ${a.name} (${a.genre || "various"})${a.verified ? " ✓" : ""} — ${a.monthly_streams?.toLocaleString() || "?"} monthly streams`);
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
        parts.push(`- ${u.emblem} ${u.name} — ${u.member_count} members, min league: ${u.min_league}${u.is_featured ? " ⭐" : ""}`);
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
        parts.push(`- "${c.name}" — ${c.status}, ${c.participant_count || 0}/${c.max_participants || "∞"} editors, category: ${c.category || "open"}`);
      }
    }

    // Platform stats
    const { count: totalEditors } = await sb.from("profiles").select("id", { count: "exact", head: true });
    const { count: totalBattles } = await sb.from("battles").select("id", { count: "exact", head: true });
    const { count: totalUnits } = await sb.from("crews").select("id", { count: "exact", head: true });
    const { count: totalDrops } = await sb.from("featured_drops").select("id", { count: "exact", head: true });
    const { count: totalEvents } = await sb.from("events").select("id", { count: "exact", head: true });

    parts.push(`\nPLATFORM STATS: ${totalEditors || 0} total editors, ${totalBattles || 0} battles fought, ${totalUnits || 0} units, ${totalDrops || 0} drops, ${totalEvents || 0} events`);

    // If we have the user's ID, fetch their personal stats
    if (userId) {
      const { data: userProfile } = await sb
        .from("profiles")
        .select("username, display_name, global_index_score, spendable_index, league, level, xp, total_wins, total_events, win_rate, best_gatekeeper_qoi, connection_count, crew_id")
        .eq("id", userId)
        .single();

      if (userProfile) {
        parts.push(`\nTHIS USER'S PROFILE (the person you're talking to):`);
        parts.push(`- Username: @${userProfile.username}, Display: ${userProfile.display_name || "not set"}`);
        parts.push(`- Index: ${userProfile.global_index_score}, Spendable IDX: ${userProfile.spendable_index}, League: ${userProfile.league}`);
        parts.push(`- Level ${userProfile.level}, XP: ${userProfile.xp}`);
        parts.push(`- Events: ${userProfile.total_events}, Wins: ${userProfile.total_wins}, Win Rate: ${userProfile.win_rate}%`);
        parts.push(`- Best QOI: ${userProfile.best_gatekeeper_qoi || "none yet"}`);
        parts.push(`- Connections: ${userProfile.connection_count}`);
        
        if (userProfile.crew_id) {
          const { data: crew } = await sb
            .from("crews")
            .select("name, emblem")
            .eq("id", userProfile.crew_id)
            .single();
          if (crew) {
            parts.push(`- Unit: ${crew.emblem} ${crew.name}`);
          }
        } else {
          parts.push(`- Unit: none (not in a unit yet)`);
        }
      }
    }

  } catch (e) {
    console.error("Failed to fetch live context:", e);
  }

  return parts.length ? "\n\n=== LIVE PLATFORM DATA (USE THIS TO ANSWER ACCURATELY — DO NOT MAKE UP DATA) ===\n" + parts.join("\n") : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch live data to give Loopy real context
    const liveContext = await fetchLiveContext(userId);

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
