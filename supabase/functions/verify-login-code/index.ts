// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { email, code } = await req.json()

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Look up the code
    const { data: loginCode, error: lookupError } = await supabaseAdmin
      .from('login_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupError) {
      console.error('Lookup error:', lookupError)
      return new Response(JSON.stringify({ error: 'Verification failed' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (!loginCode) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Mark code as used
    await supabaseAdmin
      .from('login_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', loginCode.id)

    // Generate a magic link for immediate sign-in
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
      options: {
        redirectTo: 'https://loopgate.io/hub'
      }
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      return new Response(JSON.stringify({ error: 'Failed to authenticate' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Return the token hash for client-side verification
    const tokenHash = linkData.properties?.hashed_token || ''

    console.log('Code verified for:', email)

    return new Response(JSON.stringify({ 
      success: true, 
      tokenHash,
      email: email.toLowerCase()
    }), {
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
