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

    console.log(`[verify-screenshot] Request received for ${platform}:`, { userId, platformUsername, verificationCode: verificationCode?.substring(0, 8) });

    if (!userId || !platform || !platformUsername || !verificationCode || !screenshotBase64) {
      console.log("[verify-screenshot] Missing required fields");
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

    if (profile.verification_status) {
      return new Response(
        JSON.stringify({ verified: true, message: "Already verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.verification_code !== verificationCode) {
      console.log("[verify-screenshot] Code mismatch");
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Platform-specific prompts
    const platformPrompts: Record<string, string> = {
      tiktok: `Analyze this TikTok profile screenshot. Look for:
1. The verification code "${verificationCode}" in the bio section
2. The username "@${platformUsername}" or "${platformUsername}" on the profile
3. TikTok UI elements: circular profile picture, follower/following/likes counts, bio area

Return a JSON object with:
- codeFound: boolean (true if "${verificationCode}" is visible in the bio)
- usernameFound: boolean (true if the username matches)
- isPlatformUI: boolean (true if this looks like a genuine TikTok profile page)
- confidence: number 0-100 (overall confidence in verification)
- reason: string (brief explanation)

Only return the JSON, no other text.`,
      
      instagram: `Analyze this Instagram profile screenshot. Look for:
1. The verification code "${verificationCode}" in the bio section
2. The username "@${platformUsername}" or "${platformUsername}" on the profile
3. Instagram UI elements: circular profile picture, posts/followers/following counts, bio area, Edit Profile button

Return a JSON object with:
- codeFound: boolean (true if "${verificationCode}" is visible in the bio)
- usernameFound: boolean (true if the username matches)
- isPlatformUI: boolean (true if this looks like a genuine Instagram profile page)
- confidence: number 0-100 (overall confidence in verification)
- reason: string (brief explanation)

Only return the JSON, no other text.`,

      youtube: `Analyze this YouTube channel screenshot. Look for:
1. The verification code "${verificationCode}" in the channel description/about section
2. The channel name "@${platformUsername}" or "${platformUsername}"
3. YouTube UI elements: channel banner, subscriber count, channel tabs (Home, Videos, etc.)

Return a JSON object with:
- codeFound: boolean (true if "${verificationCode}" is visible)
- usernameFound: boolean (true if the channel name matches)
- isPlatformUI: boolean (true if this looks like a genuine YouTube channel page)
- confidence: number 0-100 (overall confidence in verification)
- reason: string (brief explanation)

Only return the JSON, no other text.`
    };

    const prompt = platformPrompts[platform] || platformPrompts.tiktok;

    console.log(`[verify-screenshot] Calling AI for ${platform} verification`);

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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[verify-screenshot] AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ verified: false, message: "Verification service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ verified: false, message: "Verification service unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[verify-screenshot] AI response:", aiContent);

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
      return new Response(
        JSON.stringify({ verified: false, message: "Could not analyze screenshot. Please try again with a clearer image." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-screenshot] Parsed result:", result);

    // Check verification conditions
    const isVerified = result.codeFound && result.usernameFound && result.isPlatformUI && result.confidence >= 70;

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

      console.log("[verify-screenshot] SUCCESS - User verified!");
      return new Response(
        JSON.stringify({ 
          verified: true, 
          message: "Account verified! 🎉",
          details: result.reason
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Build helpful error message
      let errorMessage = "Verification failed. ";
      if (!result.codeFound) {
        errorMessage += `Could not find code "${verificationCode}" in your bio. `;
      }
      if (!result.usernameFound) {
        errorMessage += `Username doesn't match "@${platformUsername}". `;
      }
      if (!result.isPlatformUI) {
        errorMessage += `Screenshot doesn't appear to be a ${platform} profile. `;
      }
      if (result.confidence < 70) {
        errorMessage += `Image quality too low (${result.confidence}% confidence). `;
      }

      console.log("[verify-screenshot] Verification failed:", errorMessage);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: errorMessage.trim(),
          details: result.reason
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("[verify-screenshot] Exception:", error);
    return new Response(
      JSON.stringify({ verified: false, message: "Server error. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
