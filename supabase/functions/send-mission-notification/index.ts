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
  <div style="margin-bottom:24px;border-radius:12px;overflow:hidden;">
    <img src="${coverUrl}" alt="${missionTitle}" style="width:100%;height:auto;display:block;border-radius:12px;" />
  </div>` : ''

  const artistSection = artistName ? `<p style="color:#a78bfa;font-size:14px;text-align:center;margin:0 0 20px 0;font-weight:500;">Artist: ${artistName}</p>` : ''

  const deadlineSection = deadline ? `<p style="color:#f97316;font-size:14px;margin:8px 0 0 0;font-weight:600;">⏰ ${deadline}</p>` : ''

  const descSection = description ? `
  <div style="margin:20px 0;padding:16px;background-color:#141416;border-radius:10px;border:1px solid #2a2a2e;">
    <p style="color:#b0b0b0;font-size:14px;line-height:1.7;margin:0;">${description}</p>
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
<div style="padding:32px 16px;margin:0 auto;max-width:520px;">

  <!-- Logo -->
  <div style="text-align:center;margin-bottom:28px;">
    <img src="${LOGO_URL}" alt="Loopgate" width="48" height="48" style="width:48px;height:48px;border-radius:10px;" />
  </div>

  <!-- Cover Image -->
  ${coverSection}

  <!-- Title -->
  <h1 style="color:#ffffff;font-size:22px;font-weight:700;text-align:center;margin:0 0 6px 0;">${missionTitle}</h1>
  ${artistSection}

  <!-- Payout Card -->
  <div style="background-color:#1a1a1e;border-radius:12px;padding:20px;text-align:center;border:1px solid #2a2a2e;margin:20px 0;">
    <p style="color:#22c55e;font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 8px 0;">💰 PAYOUT</p>
    <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${payoutText}</p>
    ${deadlineSection}
  </div>

  <!-- Description -->
  ${descSection}

  <!-- CTA -->
  <a href="${missionUrl}" target="_blank" style="display:block;background-color:#22c55e;color:#000000;font-size:16px;font-weight:700;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;margin:24px 0;">View Mission →</a>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1f1f23;text-align:center;">
    <p style="color:#555;font-size:12px;margin:0 0 8px 0;">You're receiving this because you opted in to mission notifications on Loopgate.</p>
    <a href="https://loopgate.io/settings" style="color:#666;font-size:12px;text-decoration:underline;">Unsubscribe from mission emails</a>
    <p style="color:#3a3a3a;font-size:11px;margin:12px 0 0 0;">© Loopgate — Competitive Editing Index</p>
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

    // Send emails in batches
    const batchSize = 50
    let sentCount = 0
    
    for (let i = 0; i < to_emails.length; i += batchSize) {
      const batch = to_emails.slice(i, i + batchSize)
      
      const { error } = await resend.emails.send({
        from: 'Loopgate Missions <noreply@loopgate.io>',
        to: batch,
        subject: `🎬 New Mission: ${mission_title}`,
        html: emailHtml,
      })

      if (error) {
        console.error('Batch send error:', error)
      } else {
        sentCount += batch.length
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
