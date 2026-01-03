import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { userId, tiktokUsername, verificationCode } = body;

    console.log(`[verify-tiktok] Request received:`, { userId, tiktokUsername, verificationCode });

    if (!userId || !tiktokUsername || !verificationCode) {
      console.log("[verify-tiktok] Missing required fields:", { userId: !!userId, tiktokUsername: !!tiktokUsername, verificationCode: !!verificationCode });
      return new Response(
        JSON.stringify({ verified: false, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user has this verification code in their profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("verification_code, verification_status")
      .eq("id", userId)
      .single();

    console.log("[verify-tiktok] Profile lookup:", { profile, error: profileError?.message });

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ verified: false, message: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_status) {
      return new Response(
        JSON.stringify({ verified: true, message: "Already verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_code !== verificationCode) {
      console.log("[verify-tiktok] Code mismatch:", { expected: profile.verification_code, got: verificationCode });
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch TikTok profile - try multiple approaches
    const cleanUsername = tiktokUsername.replace(/^@/, "").trim();
    const tiktokUrl = `https://www.tiktok.com/@${cleanUsername}`;
    
    console.log(`[verify-tiktok] Fetching: ${tiktokUrl}`);

    // Try multiple user agents to bypass TikTok's bot detection
    const userAgents = [
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Twitterbot/1.0",
      "LinkedInBot/1.0 (compatible; Mozilla/5.0)",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ];

    let html = "";
    let fetchSuccess = false;
    let lastError = "";

    for (const ua of userAgents) {
      try {
        console.log(`[verify-tiktok] Trying UA: ${ua.substring(0, 40)}...`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(tiktokUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        
        clearTimeout(timeout);

        console.log(`[verify-tiktok] Response status: ${response.status}`);

        if (response.ok) {
          html = await response.text();
          console.log(`[verify-tiktok] HTML length: ${html.length}`);
          
          if (html.length > 5000) {
            fetchSuccess = true;
            break;
          }
        }
      } catch (e: any) {
        lastError = e.message || String(e);
        console.log(`[verify-tiktok] Fetch error: ${lastError}`);
      }
    }

    if (!fetchSuccess) {
      console.log(`[verify-tiktok] All fetches failed, submitting for manual review. Last error: ${lastError}`);
      
      await supabase
        .from("profiles")
        .update({ verification_requested_at: new Date().toISOString() })
        .eq("id", userId);

      return new Response(
        JSON.stringify({ 
          verified: false, 
          pending: true,
          message: "Auto-verification unavailable. Submitted for manual review (usually <24h)." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search for the code in the HTML content
    console.log(`[verify-tiktok] Searching for code: ${verificationCode}`);
    
    // Direct string match first
    const codeFound = html.includes(verificationCode);
    console.log(`[verify-tiktok] Direct match: ${codeFound}`);
    
    // Check meta tags and JSON data in the page
    const patterns = [
      new RegExp(`"signature"\\s*:\\s*"[^"]*${verificationCode}[^"]*"`, 'i'),
      new RegExp(`"desc"\\s*:\\s*"[^"]*${verificationCode}[^"]*"`, 'i'),
      new RegExp(`"bio"\\s*:\\s*"[^"]*${verificationCode}[^"]*"`, 'i'),
      new RegExp(`content="[^"]*${verificationCode}[^"]*"`, 'i'),
      new RegExp(`>${verificationCode}<`, 'i'),
    ];
    
    let foundViaPattern = false;
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        foundViaPattern = true;
        console.log(`[verify-tiktok] Found via pattern: ${pattern.toString().substring(0, 50)}`);
        break;
      }
    }

    const verified = codeFound || foundViaPattern;
    console.log(`[verify-tiktok] Final verification result: ${verified}`);

    if (verified) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          verification_status: true,
          verification_code: null
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[verify-tiktok] Update error:", updateError);
        return new Response(
          JSON.stringify({ verified: false, message: "Failed to update status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Also mark the TikTok platform as verified
      await supabase
        .from("connected_platforms")
        .update({ is_verified: true })
        .eq("user_id", userId)
        .eq("platform", "tiktok");

      console.log("[verify-tiktok] SUCCESS - User verified!");
      return new Response(
        JSON.stringify({ verified: true, message: "Account verified!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("[verify-tiktok] Code not found in bio");
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: "Code not found in bio. Add the code, save your profile, and try again." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("[verify-tiktok] Exception:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
