// @ts-nocheck
import React from "https://esm.sh/react@18.3.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
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

// Email template component
const LoginEmail = ({
  token,
  magicLink,
}: {
  token: string
  magicLink: string
}) => {
  const main = { backgroundColor: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  const container = { padding: '40px 20px', margin: '0 auto', maxWidth: '400px' }
  const headerSection = { textAlign: 'center' as const, marginBottom: '32px' }
  const logoText = { fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '4px', margin: '0' }
  const h1 = { color: '#ffffff', fontSize: '24px', fontWeight: '600', textAlign: 'center' as const, margin: '0 0 32px 0' }
  const codeSection = { backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '24px', textAlign: 'center' as const, border: '1px solid #333' }
  const codeLabel = { color: '#888', fontSize: '14px', margin: '0 0 12px 0' }
  const code = { color: '#ffffff', fontSize: '36px', fontWeight: '700', letterSpacing: '8px', margin: '0', fontFamily: 'monospace' }
  const codeHint = { color: '#666', fontSize: '12px', margin: '12px 0 0 0' }
  const divider = { borderColor: '#333', margin: '32px 0' }
  const orText = { color: '#888', fontSize: '14px', textAlign: 'center' as const, margin: '0 0 16px 0' }
  const linkButton = { display: 'block', backgroundColor: '#ffffff', color: '#000000', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, padding: '14px 24px', borderRadius: '8px', margin: '0 auto' }
  const footer = { color: '#666', fontSize: '12px', textAlign: 'center' as const, margin: '32px 0 8px 0' }
  const footerBrand = { color: '#444', fontSize: '11px', textAlign: 'center' as const, margin: '0' }

  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, `Your Loopgate login code: ${token}`),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: headerSection },
          React.createElement(Text, { style: logoText }, "LOOPGATE")
        ),
        React.createElement(Heading, { style: h1 }, "Sign In"),
        React.createElement(Section, { style: codeSection },
          React.createElement(Text, { style: codeLabel }, "Your login code:"),
          React.createElement(Text, { style: code }, token),
          React.createElement(Text, { style: codeHint }, "Enter this code in the app")
        ),
        React.createElement(Hr, { style: divider }),
        React.createElement(Text, { style: orText }, "Or click this link to sign in instantly:"),
        React.createElement(Link, { href: magicLink, target: "_blank", style: linkButton }, "Sign In to Loopgate →"),
        React.createElement(Text, { style: footer }, "If you didn't request this, you can safely ignore this email."),
        React.createElement(Text, { style: footerBrand }, "© Loopgate — Competitive Editing Index")
      )
    )
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate magic link using admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || 'https://loopgate.io/hub'
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      return new Response(JSON.stringify({ error: linkError.message }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Extract the token from properties
    const token = linkData.properties?.email_otp || '------'
    const magicLink = linkData.properties?.action_link || ''

    console.log('Generated link for:', email, 'token length:', token.length)

    // Render email
    const emailHtml = render(
      React.createElement(LoginEmail, { token, magicLink })
    )

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Loopgate <noreply@loopgate.io>',
      to: [email],
      subject: 'Your Loopgate Login Code',
      html: emailHtml,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log('Email sent successfully to:', email)

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
