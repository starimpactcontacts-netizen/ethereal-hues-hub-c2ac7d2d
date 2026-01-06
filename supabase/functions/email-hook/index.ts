// @ts-nocheck
import React from "https://esm.sh/react@18.3.1"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
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
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

// Email template component
const MagicLinkEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}) => {
  const verifyUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
  
  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, `Your Loopgate login code: ${token}`),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        // Logo
        React.createElement(Section, { style: headerSection },
          React.createElement(Text, { style: logoText }, "LOOPGATE")
        ),
        React.createElement(Heading, { style: h1 }, "Sign In"),
        // OTP Code Section
        React.createElement(Section, { style: codeSection },
          React.createElement(Text, { style: codeLabel }, "Your login code:"),
          React.createElement(Text, { style: code }, token),
          React.createElement(Text, { style: codeHint }, "Enter this code in the app")
        ),
        React.createElement(Hr, { style: divider }),
        // Magic Link Section
        React.createElement(Text, { style: orText }, "Or click this link to sign in instantly:"),
        React.createElement(Link, { href: verifyUrl, target: "_blank", style: linkButton }, "Sign In to Loopgate →"),
        React.createElement(Text, { style: footer }, "If you didn't request this, you can safely ignore this email."),
        React.createElement(Text, { style: footerBrand }, "© Loopgate — Competitive Editing Index")
      )
    )
  )
}

// Styles
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  
  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
        token_new: string
        token_hash_new: string
      }
    }

    // Render the email
    const emailHtml = render(
      React.createElement(MagicLinkEmail, {
        supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
        token,
        token_hash,
        redirect_to,
        email_action_type,
      })
    )

    // Determine subject based on action type
    let subject = 'Your Loopgate Login Code'
    if (email_action_type === 'signup' || email_action_type === 'email_signup') {
      subject = 'Welcome to Loopgate — Your Login Code'
    } else if (email_action_type === 'recovery') {
      subject = 'Reset Your Loopgate Password'
    }

    const { error } = await resend.emails.send({
      from: 'Loopgate <noreply@loopgate.io>',
      to: [user.email],
      subject,
      html: emailHtml,
    })
    
    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully to:', user.email)
    
  } catch (error) {
    console.error('Email hook error:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
