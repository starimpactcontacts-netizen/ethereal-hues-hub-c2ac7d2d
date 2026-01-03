import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client at top level for error handling
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, tiktokUsername, verificationCode } = await req.json();

    console.log(`[verify-tiktok] Starting verification for user ${userId}, TikTok: @${tiktokUsername}`);

    if (!userId || !tiktokUsername || !verificationCode) {
      console.log("[verify-tiktok] Missing required fields");
      return new Response(
        JSON.stringify({ verified: false, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user has this verification code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("verification_code, verification_status")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.log("[verify-tiktok] Profile not found:", profileError);
      return new Response(
        JSON.stringify({ verified: false, message: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_status) {
      console.log("[verify-tiktok] Already verified");
      return new Response(
        JSON.stringify({ verified: true, message: "Already verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_code !== verificationCode) {
      console.log("[verify-tiktok] Code mismatch");
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt to fetch TikTok profile bio using multiple methods
    const cleanUsername = tiktokUsername.replace(/^@/, "");
    const tiktokUrl = `https://www.tiktok.com/@${cleanUsername}`;
    
    console.log(`[verify-tiktok] Fetching TikTok profile: ${tiktokUrl}`);

    // Try multiple user agents - some work better with TikTok's anti-scraping
    const userAgents = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];

    let html = "";
    let fetchSuccess = false;

    for (const ua of userAgents) {
      try {
        console.log(`[verify-tiktok] Trying with UA: ${ua.substring(0, 30)}...`);
        const response = await fetch(tiktokUrl, {
          headers: {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
          },
        });

        if (response.ok) {
          html = await response.text();
          if (html.length > 1000) {
            fetchSuccess = true;
            console.log(`[verify-tiktok] Successfully fetched page (${html.length} chars)`);
            break;
          }
        }
      } catch (e) {
        console.log(`[verify-tiktok] Fetch attempt failed:`, e);
      }
    }

    if (!fetchSuccess || html.length < 1000) {
      console.log(`[verify-tiktok] All fetch attempts failed, submitting for manual review`);
      
      await supabase
        .from("profiles")
        .update({ verification_requested_at: new Date().toISOString() })
        .eq("id", userId);

      return new Response(
        JSON.stringify({ 
          verified: false, 
          pending: true,
          message: "Unable to verify automatically. Your request has been submitted for manual review." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the verification code exists in the page content
    // TikTok embeds bio in meta tags, JSON-LD, and various other locations
    const codeFound = html.includes(verificationCode);
    
    // Also check for common bio locations in TikTok's HTML structure
    const bioPatterns = [
      `"signature":"[^"]*${verificationCode}[^"]*"`,
      `"desc":"[^"]*${verificationCode}[^"]*"`,
      `content="[^"]*${verificationCode}[^"]*"`,
    ];
    
    let foundInBio = codeFound;
    if (!foundInBio) {
      for (const pattern of bioPatterns) {
        if (new RegExp(pattern, 'i').test(html)) {
          foundInBio = true;
          break;
        }
      }
    }

    console.log(`[verify-tiktok] Code found in page: ${foundInBio}`);

    if (foundInBio) {
      // Update verification status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          verification_status: true,
          verification_code: null // Clear the code after successful verification
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[verify-tiktok] Update error:", updateError);
        return new Response(
          JSON.stringify({ verified: false, message: "Failed to update verification status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[verify-tiktok] Verification successful!");
      return new Response(
        JSON.stringify({ verified: true, message: "Account verified successfully!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("[verify-tiktok] Code not found in bio");
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: "Code not found in your TikTok bio. Make sure you've added it and saved, then try again." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[verify-tiktok] Error:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
