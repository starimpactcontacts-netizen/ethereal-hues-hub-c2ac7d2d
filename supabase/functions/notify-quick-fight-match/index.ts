// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const buildMatchEmailHtml = (username: string, opponentName: string, fightId: string): string => {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
  <div style="padding: 40px 20px; margin: 0 auto; max-width: 400px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <p style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin: 0;">LOOPGATE</p>
    </div>
    <div style="background: linear-gradient(135deg, #dc2626 0%, #1a1a1a 50%, #2563eb 100%); border-radius: 12px; padding: 3px;">
      <div style="background-color: #1a1a1a; border-radius: 10px; padding: 32px 24px; text-align: center;">
        <p style="color: #ef4444; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px 0;">⚔️ QUICK EDIT BATTLE</p>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 4px 0;">Opponent Found!</h1>
        <p style="color: #888; font-size: 14px; margin: 0 0 24px 0;">Your 3-hour battle starts now</p>
        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 24px;">
          <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239,68,68,0.2); border: 3px solid #ef4444; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #ef4444; font-size: 24px; font-weight: 700;">${username.charAt(0).toUpperCase()}</span>
            </div>
            <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">${username}</p>
            <p style="color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 2px; margin: 4px 0 0 0;">RED</p>
          </div>
          <span style="color: #666; font-size: 20px; font-weight: 700;">VS</span>
          <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(37,99,235,0.2); border: 3px solid #2563eb; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center;">
              <span style="color: #2563eb; font-size: 24px; font-weight: 700;">${opponentName.charAt(0).toUpperCase()}</span>
            </div>
            <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">${opponentName}</p>
            <p style="color: #2563eb; font-size: 10px; font-weight: 700; letter-spacing: 2px; margin: 4px 0 0 0;">BLUE</p>
          </div>
        </div>
        <a href="https://loopgate.io/fight/${fightId}" target="_blank" style="display: block; background: linear-gradient(to right, #ef4444, #dc2626); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; letter-spacing: 1px;">ENTER BATTLE →</a>
      </div>
    </div>
    <p style="color: #666; font-size: 11px; text-align: center; margin: 24px 0 0 0;">Submit your edit within 3 hours or forfeit.</p>
    <p style="color: #444; font-size: 11px; text-align: center; margin: 8px 0 0 0;">© Loopgate — Competitive Editing Index</p>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fight_id } = await req.json()
    if (!fight_id) {
      return new Response(JSON.stringify({ error: 'fight_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get fight details
    const { data: fight, error: fightErr } = await supabaseAdmin
      .from('quick_fights')
      .select('*')
      .eq('id', fight_id)
      .single()

    if (fightErr || !fight) {
      return new Response(JSON.stringify({ error: 'Fight not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get emails for both players
    const { data: p1 } = await supabaseAdmin.auth.admin.getUserById(fight.player_1_id)
    const { data: p2 } = await supabaseAdmin.auth.admin.getUserById(fight.player_2_id)

    const emails: Promise<any>[] = []

    if (p1?.user?.email) {
      emails.push(resend.emails.send({
        from: 'Loopgate <noreply@loopgate.io>',
        to: [p1.user.email],
        subject: `⚔️ Quick Edit Battle: You vs ${fight.player_2_username}`,
        html: buildMatchEmailHtml(fight.player_1_username, fight.player_2_username || '???', fight.id),
      }))
    }

    if (p2?.user?.email) {
      emails.push(resend.emails.send({
        from: 'Loopgate <noreply@loopgate.io>',
        to: [p2.user.email],
        subject: `⚔️ Quick Edit Battle: You vs ${fight.player_1_username}`,
        html: buildMatchEmailHtml(fight.player_2_username || '???', fight.player_1_username, fight.id),
      }))
    }

    await Promise.allSettled(emails)
    console.log('Match emails sent for fight:', fight_id)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})