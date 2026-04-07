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
  Button,
  render,
} from "https://esm.sh/@react-email/components@0.0.22"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mission Notification Email Template
const MissionNotificationEmail = ({
  missionTitle,
  artistName,
  payoutText,
  deadline,
  missionUrl,
  description,
}: {
  missionTitle: string
  artistName?: string
  payoutText: string
  deadline?: string
  missionUrl: string
  description?: string
}) => {
  const children = [
    React.createElement(Section, { key: 'header', style: headerSection },
      React.createElement(Text, { style: logoText }, "LOOPGATE")
    ),
    React.createElement(Heading, { key: 'h1', style: h1 }, "🎬 New Mission Drop"),
    React.createElement(Text, { key: 'title', style: missionTitleStyle }, missionTitle),
  ]

  if (artistName) {
    children.push(React.createElement(Text, { key: 'artist', style: artistText }, `Artist: ${artistName}`))
  }

  const detailChildren = [
    React.createElement(Text, { key: 'label', style: detailLabel }, "💰 PAYOUT"),
    React.createElement(Text, { key: 'value', style: detailValue }, payoutText),
  ]
  if (deadline) {
    detailChildren.push(React.createElement(Text, { key: 'deadline', style: deadlineText }, `⏰ ${deadline}`))
  }
  children.push(React.createElement(Section, { key: 'details', style: detailsSection }, ...detailChildren))

  if (description) {
    children.push(React.createElement(Hr, { key: 'hr1', style: divider }))
    children.push(React.createElement(Text, { key: 'desc', style: descText }, description))
  }

  children.push(React.createElement(Hr, { key: 'hr2', style: divider }))
  children.push(React.createElement(Link, { key: 'cta', href: missionUrl, target: "_blank", style: linkButton }, "View Mission →"))
  children.push(React.createElement(Text, { key: 'footer', style: footer }, "Get in early. Limited slots available."))
  children.push(React.createElement(Text, { key: 'brand', style: footerBrand }, "© Loopgate — Competitive Editing Index"))

  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, `New Mission Available: ${missionTitle}`),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container }, ...children)
    )
  )
}

// Styles
const main = { backgroundColor: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 20px', margin: '0 auto', maxWidth: '500px' }
const headerSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: '900', color: '#d4af37', letterSpacing: '4px', margin: '0' }
const h1 = { color: '#ffffff', fontSize: '28px', fontWeight: '600', textAlign: 'center' as const, margin: '0 0 16px 0' }
const missionTitleStyle = { color: '#d4af37', fontSize: '20px', fontWeight: '700', textAlign: 'center' as const, margin: '0 0 8px 0' }
const artistText = { color: '#a78bfa', fontSize: '14px', textAlign: 'center' as const, margin: '0 0 24px 0', fontWeight: '500' }
const detailsSection = { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '24px', textAlign: 'center' as const, border: '1px solid #333', marginBottom: '24px' }
const detailLabel = { color: '#22c55e', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', margin: '0 0 8px 0' }
const detailValue = { color: '#ffffff', fontSize: '24px', fontWeight: '700', margin: '0 0 12px 0' }
const deadlineText = { color: '#f97316', fontSize: '14px', margin: '0', fontWeight: '600' }
const descText = { color: '#999', fontSize: '14px', lineHeight: '1.6', margin: '0' }
const divider = { borderColor: '#333', margin: '24px 0' }
const linkButton = { display: 'block', backgroundColor: '#22c55e', color: '#000000', fontSize: '16px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' as const, padding: '16px 24px', borderRadius: '8px', margin: '0 auto' }
const footer = { color: '#666', fontSize: '12px', textAlign: 'center' as const, margin: '32px 0 8px 0' }
const footerBrand = { color: '#444', fontSize: '11px', textAlign: 'center' as const, margin: '0' }

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

    // Render email
    const emailHtml = render(
      React.createElement(MissionNotificationEmail, {
        missionTitle: mission_title,
        artistName: artist_name,
        payoutText: payout_text || 'Paid per edit',
        deadline,
        missionUrl,
        description,
      })
    )

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
