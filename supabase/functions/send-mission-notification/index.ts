// @ts-nocheck
import { Resend } from "https://esm.sh/resend@4.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOGO_URL = 'https://tmfnqnmyxxydrxwjkaiq.supabase.co/storage/v1/object/public/bounty-covers/email-assets/loopgate-logo.png'

function buildEmailHtml(opts: {
  missionTitle: string
  artistName?: string
  payoutText: string
  deadline?: string
  missionUrl: string
  description?: string
  coverUrl?: string
}) {
  const { missionTitle, artistName, payoutText, deadline, missionUrl, description, coverUrl } = opts

  const coverSection = coverUrl ? `
  <div style="padding:0 24px;">
    <div style="border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
      <img src="${coverUrl}" alt="${missionTitle}" style="width:100%;height:auto;display:block;" />
    </div>
  </div>` : ''

  const artistSection = artistName ? `<p style="color:#d4af37;font-size:13px;text-align:center;margin:0 0 20px 0;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Film: ${artistName}</p>` : ''

  const deadlineSection = deadline ? `<p style="color:#f97316;font-size:13px;margin:10px 0 0 0;font-weight:600;">⏰ ${deadline}</p>` : ''

  const descSection = description ? `
  <div style="margin:20px 0;padding:16px 18px;background-color:#111114;border-radius:10px;border-left:3px solid #22c55e;">
    <p style="color:#a0a0a5;font-size:13px;line-height:1.7;margin:0;">${description}</p>
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#08080a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
<div style="padding:0;margin:0 auto;max-width:520px;">

  <!-- Logo above poster -->
  <div style="text-align:center;padding:28px 0 20px 0;background-color:#08080a;">
    <img src="${LOGO_URL}" alt="Loopgate" width="40" height="40" style="width:40px;height:40px;border-radius:8px;" />
  </div>

  <!-- Hero: Cinematic poster with padding + rounded corners -->
  ${coverSection}

  <!-- Content area -->
  <div style="padding:24px 20px 32px 20px;">

    <!-- Badge -->
    <div style="text-align:center;margin-bottom:16px;">
      <p style="color:#555;font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;margin:0;">NEW MISSION</p>
    </div>

    <!-- Title -->
    <h1 style="color:#ffffff;font-size:24px;font-weight:800;text-align:center;margin:0 0 6px 0;letter-spacing:-0.3px;">${missionTitle}</h1>
    ${artistSection}

    <!-- Payout Card -->
    <div style="background:linear-gradient(135deg,#141418 0%,#1a1a20 100%);border-radius:14px;padding:22px;text-align:center;border:1px solid #22c55e22;margin:20px 0;">
      <p style="color:#22c55e;font-size:10px;font-weight:700;letter-spacing:3px;margin:0 0 10px 0;">PAYOUT</p>
      <p style="color:#ffffff;font-size:26px;font-weight:800;margin:0;letter-spacing:-0.5px;">${payoutText}</p>
      ${deadlineSection}
    </div>

    <!-- Description -->
    ${descSection}

    <!-- CTA -->
    <a href="${missionUrl}" target="_blank" style="display:block;background-color:#22c55e;color:#000000;font-size:15px;font-weight:800;text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;margin:24px 0 0 0;letter-spacing:0.3px;">View Mission →</a>

  </div>

  <!-- Footer -->
  <div style="padding:20px;border-top:1px solid #1a1a1e;text-align:center;">
    <p style="color:#444;font-size:11px;margin:0 0 6px 0;">You're receiving this because you opted in to mission alerts on Loopgate.</p>
    <a href="https://loopgate.io/settings" style="color:#555;font-size:11px;text-decoration:underline;">Unsubscribe from mission emails</a>
    <p style="color:#2a2a2e;font-size:10px;margin:10px 0 0 0;">© Loopgate — Competitive Editing Index</p>
  </div>

</div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { 
      mission_id,
      to_emails,
      mission_title,
      artist_name,
      payout_text,
      deadline,
      description,
      cover_url,
    } = await req.json()

    if (!to_emails || !Array.isArray(to_emails) || to_emails.length === 0) {
      throw new Error('Missing to_emails array')
    }
    if (!mission_title) {
      throw new Error('Missing mission_title')
    }

    const missionUrl = mission_id 
      ? `https://loopgate.io/commissions/${mission_id}` 
      : 'https://loopgate.io/commissions'

    const emailHtml = buildEmailHtml({
      missionTitle: mission_title,
      artistName: artist_name,
      payoutText: payout_text || 'Paid per edit',
      deadline,
      missionUrl,
      description,
      coverUrl: cover_url,
    })

    // Send individual emails so recipients don't see each other
    let sentCount = 0
    const concurrency = 10
    
    for (let i = 0; i < to_emails.length; i += concurrency) {
      const chunk = to_emails.slice(i, i + concurrency)
      const results = await Promise.allSettled(
        chunk.map((email: string) =>
          resend.emails.send({
            from: 'Loopgate Missions <noreply@loopgate.io>',
            to: [email],
            subject: `🎬 New Mission: ${mission_title}`,
            html: emailHtml,
          })
        )
      )
      for (const r of results) {
        if (r.status === 'fulfilled' && !r.value.error) sentCount++
        else console.error('Send error:', r.status === 'rejected' ? r.reason : r.value.error)
      }
    }

    console.log(`Mission notification emails sent: ${sentCount}/${to_emails.length}`)

    return new Response(JSON.stringify({ 
      success: true, 
      sent: sentCount,
      total: to_emails.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Mission notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
