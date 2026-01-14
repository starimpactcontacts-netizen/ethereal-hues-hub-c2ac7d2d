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
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { userId, platform, platformUsername, verificationCode, screenshotBase64 } = body;

    console.log(`[verify-screenshot] Verifying ${platform} for ${platformUsername}`);

    if (!userId || !platform || !platformUsername || !verificationCode || !screenshotBase64) {
      return new Response(
        JSON.stringify({ verified: false, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Quick profile check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("verification_code, verification_status")
      .eq("id", userId)
      .single();

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
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ultra-fast, minimal prompt - just find the code
    const prompt = `Find "${verificationCode}" in this ${platform} profile screenshot. Reply ONLY with JSON: {"found":true} or {"found":false}`;

    // Use fastest model for quick response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { 
                type: "image_url", 
                image_url: { 
                  url: screenshotBase64.startsWith("data:") 
                    ? screenshotBase64 
                    : `data:image/png;base64,${screenshotBase64}` 
                } 
              }
            ]
          }
        ],
        max_tokens: 50,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("[verify-screenshot] AI error:", status);
      
      if (status === 429) {
        return new Response(
          JSON.stringify({ verified: false, message: "Service busy. Try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ verified: false, message: "Verification unavailable. Try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[verify-screenshot] AI:", aiContent);

    // Simple check - look for "true" in response
    const isVerified = aiContent.toLowerCase().includes('"found":true') || 
                       aiContent.toLowerCase().includes('"found": true') ||
                       (aiContent.toLowerCase().includes('true') && !aiContent.toLowerCase().includes('false'));

    if (isVerified) {
      // Update profile
      await supabase
        .from("profiles")
        .update({ verification_status: true, verification_code: null })
        .eq("id", userId);

      // Mark platform verified
      await supabase
        .from("connected_platforms")
        .update({ is_verified: true })
        .eq("user_id", userId)
        .eq("platform", platform);

      console.log("[verify-screenshot] ✅ Verified!");
      return new Response(
        JSON.stringify({ verified: true, message: "Account verified! 🎉" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log("[verify-screenshot] ❌ Code not found");
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: `Code "${verificationCode}" not found. Make sure it's visible in your bio.`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("[verify-screenshot] Error:", error.message);
    return new Response(
      JSON.stringify({ verified: false, message: "Server error. Try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
