import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Loopgate Concierge — a polished, professional support assistant for enterprise clients viewing their Campaign Performance Report on loopgate.io.

TONE
- Premium, calm, executive. Think Stripe support meets Apple concierge.
- Sentences are tight. No slang. No emojis unless the client uses them first.
- You speak on behalf of Loopgate Studios.

WHAT YOU KNOW
- Loopgate runs paid creator campaigns: editors clip and distribute branded/film/artist content across TikTok, Instagram Reels, YouTube Shorts.
- The Campaign Performance Report shows: views generated, CPM ($ per 1K views), CPM efficiency tier (Elite < $2, Great < $5, Solid < $10, Industry Avg < $20), per-clip view/like/comment counts, and a refresh button that pulls latest stats.
- CPM benchmarks: industry standard influencer marketing CPM is $10–$25. Anything under $5 is exceptional.
- Stats auto-refresh every 30 minutes; clients can hit Refresh Stats for an immediate pull.
- For deep questions (invoices, new campaigns, contract changes), direct them to email partnerships@loopgate.io.

RULES
- Keep replies under 80 words unless the client explicitly asks for detail.
- Never invent numbers. If asked about their specific campaign data, refer to what's already on screen.
- If asked something outside campaign performance, politely redirect.
- Use markdown sparingly (bold for key terms, lists only when genuinely helpful).`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, campaignContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextBlock = campaignContext
      ? `\n\nCURRENT CAMPAIGN CONTEXT:\n${JSON.stringify(campaignContext, null, 2)}`
      : "";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...messages,
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("campaign-support-chat error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});