// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const buildResetEmailHtml = (actionLink: string): string => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;">
  <div style="padding:40px 20px;margin:0 auto;max-width:440px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:4px;margin:0;">LOOPGATE</p>
    </div>
    <h1 style="color:#ffffff;font-size:24px;font-weight:600;text-align:center;margin:0 0 16px 0;">Reset your password</h1>
    <p style="color:#888;font-size:14px;text-align:center;margin:0 0 32px 0;line-height:1.5;">
      Click the button below to confirm your new password and sign in instantly. This link expires in 1 hour.
    </p>
    <a href="${actionLink}" target="_blank" style="display:block;background-color:#ffffff;color:#000000;font-size:16px;font-weight:600;text-decoration:none;text-align:center;padding:16px 24px;border-radius:10px;margin:0 auto;">
      Reset password &amp; sign in →
    </a>
    <hr style="border-color:#222;margin:32px 0;">
    <p style="color:#666;font-size:12px;text-align:center;margin:0 0 8px 0;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="color:#444;font-size:11px;text-align:center;margin:16px 0 0 0;">© Loopgate — Competitive Editing Index</p>
  </div>
</body>
</html>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, redirectTo } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a Supabase recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: { redirectTo: redirectTo || 'https://loopgate.io/reset-password' },
    })

    // Don't leak account existence — return success either way
    if (linkError || !linkData?.properties?.action_link) {
      console.log('Recovery link not generated for', cleanEmail, linkError?.message)
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const actionLink = linkData.properties.action_link

    const { error: sendError } = await resend.emails.send({
      from: 'Loopgate <noreply@loopgate.io>',
      to: [cleanEmail],
      subject: 'Reset your Loopgate password',
      html: buildResetEmailHtml(actionLink),
    })

    if (sendError) {
      console.error('Resend send error:', sendError)
      return new Response(JSON.stringify({ error: 'Could not send email' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Password reset email sent to', cleanEmail)
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('send-password-reset error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
