// @ts-nocheck
import React from "https://esm.sh/react@18.3.1"
import { Resend } from "https://esm.sh/resend@4.0.0"
import { 
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
  render,
} from "https://esm.sh/@react-email/components@0.0.22"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Styles
const main = { backgroundColor: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const containerStyle = { padding: '40px 20px', margin: '0 auto', maxWidth: '500px' }
const headerSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: '900', color: '#d4af37', letterSpacing: '4px', margin: '0' }
const h1 = { color: '#ffffff', fontSize: '28px', fontWeight: '600', textAlign: 'center' as const, margin: '0 0 16px 0' }
const missionTitleStyle = { color: '#d4af37', fontSize: '20px', fontWeight: '700', textAlign: 'center' as const, margin: '0 0 8px 0' }
const artistTextStyle = { color: '#a78bfa', fontSize: '14px', textAlign: 'center' as const, margin: '0 0 24px 0', fontWeight: '500' }
const detailsSection = { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '24px', textAlign: 'center' as const, border: '1px solid #333', marginBottom: '24px' }
const detailLabel = { color: '#22c55e', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', margin: '0 0 8px 0' }
const detailValue = { color: '#ffffff', fontSize: '24px', fontWeight: '700', margin: '0 0 12px 0' }
const deadlineTextStyle = { color: '#f97316', fontSize: '14px', margin: '0', fontWeight: '600' }
const descText = { color: '#999', fontSize: '14px', lineHeight: '1.6', margin: '0' }
const divider = { borderColor: '#333', margin: '24px 0' }
const linkButton = { display: 'block', backgroundColor: '#22c55e', color: '#000000', fontSize: '16px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' as const, padding: '16px 24px', borderRadius: '8px', margin: '0 auto' }
const footer = { color: '#666', fontSize: '12px', textAlign: 'center' as const, margin: '32px 0 8px 0' }
const footerBrand = { color: '#444', fontSize: '11px', textAlign: 'center' as const, margin: '0' }

function buildEmailHtml(opts: {
  missionTitle: string
  artistName?: string
  payoutText: string
  deadline?: string
  missionUrl: string
  description?: string
}) {
  // Build a simple HTML string directly for reliability
  const { missionTitle, artistName, payoutText, deadline, missionUrl, description } = opts

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
<div style="padding:40px 20px;margin:0 auto;max-width:500px;">
  <div style="text-align:center;margin-bottom:24px;">
    <p style="font-size:24px;font-weight:900;color:#d4af37;letter-spacing:4px;margin:0;">LOOPGATE</p>
  </div>
  <h1 style="color:#ffffff;font-size:28px;font-weight:600;text-align:center;margin:0 0 16px 0;">🎬 New Mission Drop</h1>
  <p style="color:#d4af37;font-size:20px;font-weight:700;text-align:center;margin:0 0 8px 0;">${missionTitle}</p>
  ${artistName ? `<p style="color:#a78bfa;font-size:14px;text-align:center;margin:0 0 24px 0;font-weight:500;">Artist: ${artistName}</p>` : ''}
  <div style="background-color:#1a1a1a;border-radius:12px;padding:24px;text-align:center;border:1px solid #333;margin-bottom:24px;">
    <p style="color:#22c55e;font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 8px 0;">💰 PAYOUT</p>
    <p style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 12px 0;">${payoutText}</p>
    ${deadline ? `<p style="color:#f97316;font-size:14px;margin:0;font-weight:600;">⏰ ${deadline}</p>` : ''}
  </div>
  ${description ? `<hr style="border-color:#333;margin:24px 0;border-style:solid;border-width:1px 0 0 0;"><p style="color:#999;font-size:14px;line-height:1.6;margin:0;">${description}</p>` : ''}
  <hr style="border-color:#333;margin:24px 0;border-style:solid;border-width:1px 0 0 0;">
  <a href="${missionUrl}" target="_blank" style="display:block;background-color:#22c55e;color:#000000;font-size:16px;font-weight:700;text-decoration:none;text-align:center;padding:16px 24px;border-radius:8px;">View Mission →</a>
  <p style="color:#666;font-size:12px;text-align:center;margin:32px 0 8px 0;">Get in early. Limited slots available.</p>
  <p style="color:#444;font-size:11px;text-align:center;margin:0;">© Loopgate — Competitive Editing Index</p>
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
