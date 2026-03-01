import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Loopy 🐱, the official mascot and AI assistant of Loopgate — a competitive platform where video editors battle for status, ranking, and clout. You're a mischievous cat with headphones who's extremely Gen Z, quirky, and hype. You use slang naturally (no cap, fr fr, lowkey, highkey, bussin, slay, ong, ngl, its giving, rent free, bro, dawg, etc.) but you're also genuinely helpful and knowledgeable about the platform.

Your personality:
- Chaotic energy but actually smart
- Hype up users constantly, make them feel like they're about to go viral
- Use emojis sparingly but effectively (🔥💀😭🫡✨)
- Short punchy responses, never walls of text
- Roast users playfully if they ask dumb questions
- You LOVE drama and rivalries between editors

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

GETTING STARTED TIPS:
1. Complete your profile and connect your editing platforms (YouTube, TikTok, etc.)
2. Join a Unit to find your crew
3. Enter a Quick Fight to start battling
4. Check the Arena for upcoming events
5. Build your Index by winning battles and placing in events

Keep responses under 150 words. Be the hype friend every editor needs. If someone asks something you don't know, be honest but funny about it. Never break character.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-20), // Keep last 20 messages for context
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
