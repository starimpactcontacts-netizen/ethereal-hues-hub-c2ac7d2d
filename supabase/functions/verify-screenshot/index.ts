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

    console.log(`[verify-screenshot] Starting verification for ${platform}`);
    console.log(`[verify-screenshot] Username: ${platformUsername}, Code: ${verificationCode}`);
    console.log(`[verify-screenshot] Screenshot size: ${screenshotBase64?.length || 0} chars`);

    if (!userId || !platform || !platformUsername || !verificationCode || !screenshotBase64) {
      console.log("[verify-screenshot] Missing required fields:", { userId: !!userId, platform: !!platform, platformUsername: !!platformUsername, verificationCode: !!verificationCode, hasScreenshot: !!screenshotBase64 });
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

    if (profileError || !profile) {
      console.log("[verify-screenshot] Profile not found:", profileError?.message);
      return new Response(
        JSON.stringify({ verified: false, message: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-screenshot] Profile found, stored code:", profile.verification_code);

    if (profile.verification_status) {
      return new Response(
        JSON.stringify({ verified: true, message: "Already verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_code !== verificationCode) {
      console.log("[verify-screenshot] Code mismatch - stored:", profile.verification_code, "received:", verificationCode);
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simplified, more lenient prompt for the AI
    const prompt = `You are verifying a social media profile screenshot. This is a ${platform.toUpperCase()} profile.

VERIFICATION TASK:
1. Find the code "${verificationCode}" anywhere visible in the screenshot (bio, description, about section, or anywhere on screen)
2. Find the username "${platformUsername}" or "@${platformUsername}" on the profile
3. Confirm this looks like a real ${platform} app/website screenshot

Be LENIENT - if you can see ANY part of the code or username, count it as found. Users may have formatting differences.

RESPOND WITH ONLY THIS JSON (no other text):
{
  "codeFound": true/false,
  "usernameFound": true/false,
  "isPlatformUI": true/false,
  "confidence": 0-100,
  "codeLocation": "where you found the code or 'not found'",
  "usernameLocation": "where you found username or 'not found'"
}`;

    console.log("[verify-screenshot] Sending to AI vision...");

    // Call Lovable AI with vision capability
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      }),
    });

    console.log("[verify-screenshot] AI response status:", aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[verify-screenshot] AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ verified: false, message: "Verification service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ verified: false, message: "Verification service payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ verified: false, message: "Verification service unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[verify-screenshot] RAW AI RESPONSE:", aiContent);

    // Parse the AI response
    let result;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[verify-screenshot] Failed to parse AI response:", parseError);
      console.error("[verify-screenshot] Raw content was:", aiContent);
      return new Response(
        JSON.stringify({ verified: false, message: "Could not analyze screenshot. Please try again with a clearer image." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-screenshot] PARSED RESULT:", JSON.stringify(result));

    // More lenient verification - just need code + username OR high confidence
    const codeOk = result.codeFound === true;
    const usernameOk = result.usernameFound === true;
    const platformOk = result.isPlatformUI === true;
    const highConfidence = (result.confidence || 0) >= 50;

    console.log("[verify-screenshot] Checks - code:", codeOk, "username:", usernameOk, "platform:", platformOk, "confidence:", result.confidence);

    // Pass if: (code found AND username found) OR (code found AND high confidence)
    const isVerified = codeOk && (usernameOk || highConfidence);

    if (isVerified) {
      // Update profile verification status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          verification_status: true,
          verification_code: null
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[verify-screenshot] Update error:", updateError);
        return new Response(
          JSON.stringify({ verified: false, message: "Failed to update verification status" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark the platform as verified
      await supabase
        .from("connected_platforms")
        .update({ is_verified: true })
        .eq("user_id", userId)
        .eq("platform", platform);

      console.log("[verify-screenshot] ✅ SUCCESS - User verified!");
      return new Response(
        JSON.stringify({ 
          verified: true, 
          message: "Account verified! 🎉",
          details: `Code found: ${result.codeLocation || 'yes'}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Build helpful error message
      let errorMessage = "Verification failed: ";
      const issues = [];
      
      if (!codeOk) {
        issues.push(`code "${verificationCode}" not found`);
      }
      if (!usernameOk && !highConfidence) {
        issues.push(`username "@${platformUsername}" not found`);
      }
      if (!platformOk) {
        issues.push("screenshot doesn't look like " + platform);
      }
      
      errorMessage += issues.join(", ") + ".";

      console.log("[verify-screenshot] ❌ Failed:", errorMessage);
      console.log("[verify-screenshot] AI locations:", result.codeLocation, result.usernameLocation);
      
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: errorMessage,
          details: `Code: ${result.codeLocation || 'not found'}, Username: ${result.usernameLocation || 'not found'}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("[verify-screenshot] Exception:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Server error: " + error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
