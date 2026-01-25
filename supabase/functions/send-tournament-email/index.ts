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
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tournament Started Email Template
const TournamentStartedEmail = ({
  tournamentName,
  theme,
  deadline,
  tournamentUrl,
}: {
  tournamentName: string
  theme: string
  deadline: string
  tournamentUrl: string
}) => {
  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, `${tournamentName} has started — Theme Released!`),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        // Logo
        React.createElement(Section, { style: headerSection },
          React.createElement(Text, { style: logoText }, "LOOPGATE")
        ),
        React.createElement(Heading, { style: h1 }, "🏆 Tournament Started!"),
        React.createElement(Text, { style: tournamentTitle }, tournamentName),
        
        // Theme Section
        React.createElement(Section, { style: themeSection },
          React.createElement(Text, { style: themeLabel }, "✨ THEME REVEALED"),
          React.createElement(Text, { style: themeText }, theme || "Open Theme - Create your best edit!")
        ),
        
        React.createElement(Hr, { style: divider }),
        
        // Deadline
        React.createElement(Text, { style: deadlineText }, 
          `⏰ Submissions close: ${deadline}`
        ),
        
        // CTA
        React.createElement(Link, { href: tournamentUrl, target: "_blank", style: linkButton }, 
          "Enter Tournament →"
        ),
        
        React.createElement(Text, { style: footer }, 
          "Good luck, editor. May the best edit win."
        ),
        React.createElement(Text, { style: footerBrand }, "© Loopgate — Competitive Editing Index")
      )
    )
  )
}

// Styles
const main = { backgroundColor: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '40px 20px', margin: '0 auto', maxWidth: '500px' }
const headerSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '24px', fontWeight: '900', color: '#d4af37', letterSpacing: '4px', margin: '0' }
const h1 = { color: '#ffffff', fontSize: '28px', fontWeight: '600', textAlign: 'center' as const, margin: '0 0 16px 0' }
const tournamentTitle = { color: '#d4af37', fontSize: '20px', fontWeight: '700', textAlign: 'center' as const, margin: '0 0 32px 0' }
const themeSection = { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '24px', textAlign: 'center' as const, border: '1px solid #333', marginBottom: '24px' }
const themeLabel = { color: '#a855f7', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', margin: '0 0 12px 0' }
const themeText = { color: '#ffffff', fontSize: '18px', fontWeight: '500', margin: '0', lineHeight: '1.5' }
const divider = { borderColor: '#333', margin: '24px 0' }
const deadlineText = { color: '#f97316', fontSize: '14px', textAlign: 'center' as const, margin: '0 0 24px 0', fontWeight: '600' }
const linkButton = { display: 'block', backgroundColor: '#d4af37', color: '#000000', fontSize: '16px', fontWeight: '700', textDecoration: 'none', textAlign: 'center' as const, padding: '16px 24px', borderRadius: '8px', margin: '0 auto' }
const footer = { color: '#666', fontSize: '12px', textAlign: 'center' as const, margin: '32px 0 8px 0' }
const footerBrand = { color: '#444', fontSize: '11px', textAlign: 'center' as const, margin: '0' }

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { tournament_id } = await req.json()
    
    if (!tournament_id) {
      throw new Error('Missing tournament_id')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('sanctioned_tournaments')
      .select('*')
      .eq('id', tournament_id)
      .single()

    if (tournamentError || !tournament) {
      throw new Error('Tournament not found')
    }

    // Get participants with their emails
    const { data: participants, error: participantsError } = await supabase
      .from('sanctioned_tournament_participants')
      .select('user_id')
      .eq('tournament_id', tournament_id)

    if (participantsError) {
      throw new Error('Failed to fetch participants')
    }

    // Get emails from auth.users (service role required)
    const userIds = participants?.map(p => p.user_id) || []
    
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No participants to notify' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Get profiles with emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (profilesError) {
      throw new Error('Failed to fetch profile emails')
    }

    const emails = profiles?.filter(p => p.email).map(p => p.email) || []

    if (emails.length === 0) {
      return new Response(JSON.stringify({ message: 'No emails found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Format deadline
    const deadline = tournament.submission_deadline 
      ? new Date(tournament.submission_deadline).toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : '48 hours from now'

    const tournamentUrl = `https://loopgate.io/sanctioned/${tournament_id}`

    // Render email
    const emailHtml = render(
      React.createElement(TournamentStartedEmail, {
        tournamentName: tournament.name,
        theme: tournament.theme || 'Open Theme',
        deadline,
        tournamentUrl,
      })
    )

    // Send emails in batches (Resend limit)
    const batchSize = 50
    let sentCount = 0
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      
      const { error } = await resend.emails.send({
        from: 'Loopgate Tournaments <noreply@loopgate.io>',
        to: batch,
        subject: `🏆 ${tournament.name} — Theme Released!`,
        html: emailHtml,
      })

      if (error) {
        console.error('Batch send error:', error)
      } else {
        sentCount += batch.length
      }
    }

    console.log(`Tournament emails sent: ${sentCount}/${emails.length}`)

    return new Response(JSON.stringify({ 
      success: true, 
      sent: sentCount,
      total: emails.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    console.error('Tournament email error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})