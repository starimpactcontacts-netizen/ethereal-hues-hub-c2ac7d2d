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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Attempt to fetch TikTok profile bio
    // Note: TikTok's public API doesn't expose bio directly
    // We'll try scraping the public profile page
    const cleanUsername = tiktokUsername.replace(/^@/, "");
    const tiktokUrl = `https://www.tiktok.com/@${cleanUsername}`;
    
    console.log(`[verify-tiktok] Fetching TikTok profile: ${tiktokUrl}`);

    try {
      const response = await fetch(tiktokUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!response.ok) {
        console.log(`[verify-tiktok] TikTok fetch failed: ${response.status}`);
        // Fall back to pending verification for admin review
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ verification_requested_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) {
          console.error("[verify-tiktok] Update error:", updateError);
        }

        return new Response(
          JSON.stringify({ 
            verified: false, 
            pending: true,
            message: "Unable to verify automatically. Your request has been submitted for manual review." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const html = await response.text();
      
      // Check if the verification code exists in the page content
      // TikTok embeds bio in the page HTML
      const codeFound = html.includes(verificationCode);

      console.log(`[verify-tiktok] Code found in page: ${codeFound}`);

      if (codeFound) {
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
            message: "Code not found in your TikTok bio. Make sure you've added it and try again." 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fetchError) {
      console.error("[verify-tiktok] Fetch error:", fetchError);
      
      // Submit for manual review
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
  } catch (error) {
    console.error("[verify-tiktok] Error:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
