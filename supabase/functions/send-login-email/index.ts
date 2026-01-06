// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Build email HTML directly without React (avoids version conflicts)
const buildLoginEmailHtml = (token: string, magicLink: string): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
  <div style="padding: 40px 20px; margin: 0 auto; max-width: 400px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 4px; margin: 0;">LOOPGATE</p>
    </div>
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 32px 0;">Sign In</h1>
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #333;">
      <p style="color: #888; font-size: 14px; margin: 0 0 12px 0;">Your login code:</p>
      <p style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0; font-family: monospace;">${token}</p>
      <p style="color: #666; font-size: 12px; margin: 12px 0 0 0;">Enter this code in the app</p>
    </div>
    <hr style="border-color: #333; margin: 32px 0;">
    <p style="color: #888; font-size: 14px; text-align: center; margin: 0 0 16px 0;">Or click this link to sign in instantly:</p>
    <a href="${magicLink}" target="_blank" style="display: block; background-color: #ffffff; color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; margin: 0 auto;">Sign In to Loopgate →</a>
    <p style="color: #666; font-size: 12px; text-align: center; margin: 32px 0 8px 0;">If you didn't request this, you can safely ignore this email.</p>
    <p style="color: #444; font-size: 11px; text-align: center; margin: 0;">© Loopgate — Competitive Editing Index</p>
  </div>
</body>
</html>`
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

    // Extract the token from properties (force 6 digits)
    const token = (linkData.properties?.email_otp || '------').slice(0, 6)
    const magicLink = linkData.properties?.action_link || ''

    console.log('Generated link for:', email, 'token length:', token.length)

    // Build email HTML
    const emailHtml = buildLoginEmailHtml(token, magicLink)

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
