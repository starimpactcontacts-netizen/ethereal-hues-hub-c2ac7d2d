import { Resend } from "https://esm.sh/resend@4.0.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
}

// ── Email Template (raw HTML) ────────────────────────────────────────
function buildBattleEmail(username: string, opponentUsername: string, durationHours: number, battleUrl: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0">
<div style="padding:40px 20px;margin:0 auto;max-width:500px">
  <p style="font-size:24px;font-weight:900;color:#d4af37;letter-spacing:4px;text-align:center;margin:0 0 24px 0">LOOPGATE</p>
  <h1 style="color:#fff;font-size:28px;font-weight:600;text-align:center;margin:0 0 16px 0">⚔️ Battle Auto-Matched!</h1>
  <p style="color:#ccc;font-size:14px;text-align:center;margin:0 0 24px 0">Hey ${username}, your open 1v1 challenge has been matched.</p>
  <div style="background:#1a1a1a;border-radius:12px;padding:24px;text-align:center;border:1px solid #333;margin-bottom:24px">
    <p style="color:#d4af37;font-size:20px;font-weight:700;margin:0;letter-spacing:2px">${username}  VS  ${opponentUsername}</p>
  </div>
  <hr style="border-color:#333;margin:24px 0"/>
  <p style="color:#f97316;font-size:14px;text-align:center;margin:0 0 24px 0;font-weight:600">⏰ ${durationHours}h battle — clock is ticking!</p>
  <a href="${battleUrl}" target="_blank" style="display:block;background:#d4af37;color:#000;font-size:16px;font-weight:700;text-decoration:none;text-align:center;padding:16px 24px;border-radius:8px;margin:0 auto">View Battle →</a>
  <p style="color:#666;font-size:12px;text-align:center;margin:32px 0 8px 0">Submit your best edit before the timer runs out.</p>
  <p style="color:#444;font-size:11px;text-align:center;margin:0">© Loopgate — Competitive Editing Index</p>
</div>
</body></html>`
}

// ── Main handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find open battles older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: staleBattles, error: fetchErr } = await supabase
      .from("battles")
      .select("*")
      .eq("status", "pending")
      .eq("challenge_type", "open")
      .is("opponent_id", null)
      .lt("created_at", twoHoursAgo)
      .order("created_at", { ascending: true })

    if (fetchErr) {
      console.error("Error fetching stale battles:", fetchErr)
      throw fetchErr
    }

    if (!staleBattles || staleBattles.length === 0) {
      console.log("No stale open battles found")
      return new Response(JSON.stringify({ matched: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    console.log(`Found ${staleBattles.length} stale open battle(s)`)

    let matchedCount = 0
    const alreadyMatched = new Set<string>() // track battles we've used this run

    for (let i = 0; i < staleBattles.length; i++) {
      const battle = staleBattles[i]
      if (alreadyMatched.has(battle.id)) continue

      // Try to find another stale open battle to pair with (different challenger)
      const partner = staleBattles.find(
        (b) =>
          b.id !== battle.id &&
          !alreadyMatched.has(b.id) &&
          b.challenger_id !== battle.challenger_id
      )

      if (!partner) {
        console.log(`No match partner for battle ${battle.id} (${battle.challenger_username})`)
        continue
      }

      alreadyMatched.add(battle.id)
      alreadyMatched.add(partner.id)

      // Cancel the partner battle (we merge into the first one)
      await supabase
        .from("battles")
        .update({ status: "cancelled" })
        .eq("id", partner.id)

      // Activate the first battle with the partner as opponent
      const startsAt = new Date()
      const endsAt = new Date(startsAt.getTime() + battle.duration_hours * 60 * 60 * 1000)

      const { error: updateErr } = await supabase
        .from("battles")
        .update({
          opponent_id: partner.challenger_id,
          opponent_username: partner.challenger_username,
          opponent_avatar_url: partner.challenger_avatar_url,
          status: "active",
          accepted_at: startsAt.toISOString(),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .eq("id", battle.id)

      if (updateErr) {
        console.error(`Failed to match battle ${battle.id}:`, updateErr)
        continue
      }

      console.log(`Matched: ${battle.challenger_username} vs ${partner.challenger_username} (battle ${battle.id})`)
      matchedCount++

      const battleUrl = `https://loopgate.io/battle/${battle.id}`

      // ── In-app notifications ──
      const notifications = [
        {
          user_id: battle.challenger_id,
          type: "battle_auto_matched",
          title: "⚔️ Battle Auto-Matched!",
          message: `Your open challenge has been matched with ${partner.challenger_username}. The ${battle.duration_hours}h clock starts now!`,
          data: { battle_id: battle.id, opponent: partner.challenger_username },
          read: false,
        },
        {
          user_id: partner.challenger_id,
          type: "battle_auto_matched",
          title: "⚔️ Battle Auto-Matched!",
          message: `You've been matched against ${battle.challenger_username} in a ${battle.duration_hours}h 1v1 battle. The clock starts now!`,
          data: { battle_id: battle.id, opponent: battle.challenger_username },
          read: false,
        },
      ]

      const { error: notifErr } = await supabase.from("notifications").insert(notifications)
      if (notifErr) console.error("Notification insert error:", notifErr)

      // ── Email notifications ──
      // Get emails for both users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, username")
        .in("id", [battle.challenger_id, partner.challenger_id])

      if (profiles) {
        for (const profile of profiles) {
          if (!profile.email) continue

          const isChallenger = profile.id === battle.challenger_id
          const opponentName = isChallenger ? partner.challenger_username : battle.challenger_username

          try {
            const emailHtml = buildBattleEmail(
              profile.username || "Editor",
              opponentName,
              battle.duration_hours,
              battleUrl,
            )

            await resend.emails.send({
              from: "Loopgate Battles <noreply@loopgate.io>",
              to: [profile.email],
              subject: `⚔️ Your 1v1 Battle Has Started — ${profile.username} vs ${opponentName}`,
              html: emailHtml,
            })

            console.log(`Email sent to ${profile.email}`)
          } catch (emailErr) {
            console.error(`Email failed for ${profile.email}:`, emailErr)
          }
        }
      }
    }

    console.log(`Auto-match complete: ${matchedCount} battle(s) matched`)

    return new Response(JSON.stringify({ matched: matchedCount }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  } catch (error: any) {
    console.error("Auto-match error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
})
