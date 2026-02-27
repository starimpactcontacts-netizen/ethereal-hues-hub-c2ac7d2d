import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type EmailType = "score_rated" | "battle_update" | "new_drop" | "connection_request" | "connection_accepted" | "battle_result";

interface EmailRequest {
  user_id: string;
  email_type: EmailType;
  data: Record<string, any>;
}

const PREFERENCE_MAP: Record<EmailType, string> = {
  score_rated: "notify_scores",
  battle_update: "notify_battles",
  battle_result: "notify_battles",
  new_drop: "notify_drops",
  connection_request: "notify_connections",
  connection_accepted: "notify_connections",
};

function buildEmail(type: EmailType, data: Record<string, any>): { subject: string; html: string } {
  const baseStyle = `
    font-family: 'Inter', -apple-system, sans-serif;
    background-color: #000;
    color: #fff;
  `;
  const cardStyle = `
    background: #111;
    border: 1px solid #222;
    border-radius: 12px;
    padding: 24px;
    margin: 20px 0;
  `;
  const ctaStyle = `
    display: inline-block;
    background: #ef4444;
    color: #fff;
    padding: 12px 28px;
    text-decoration: none;
    font-weight: 700;
    font-size: 14px;
    border-radius: 8px;
    margin-top: 16px;
  `;
  const footerStyle = `
    color: #555;
    font-size: 11px;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #222;
  `;

  const wrap = (content: string, subject: string) => ({
    subject,
    html: `
      <div style="${baseStyle} padding: 32px 16px; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #ef4444;">LOOPGATE</span>
        </div>
        <div style="${cardStyle}">
          ${content}
        </div>
        <div style="${footerStyle}">
          <p>You're receiving this because you have email notifications enabled on Loopgate.</p>
          <p>To manage your preferences, go to My Arena → Email Settings.</p>
        </div>
      </div>
    `,
  });

  switch (type) {
    case "score_rated":
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Edit Got Rated</p>
        <h2 style="margin: 0 0 4px; font-size: 28px; font-weight: 900;">
          <span style="color: #facc15;">${data.score}</span><span style="color: #555;">/100 QOI</span>
        </h2>
        <p style="color: #aaa; font-size: 14px; margin: 8px 0 0;">
          Rated by <strong style="color: #fff;">@${data.judge_username || "judge"}</strong>
        </p>
        ${data.feedback ? `<p style="color: #888; font-size: 13px; margin-top: 12px; font-style: italic;">"${data.feedback}"</p>` : ""}
        <a href="https://loopgate.io/arena?tab=my" style="${ctaStyle}">View Your Score →</a>
        `,
        `Your edit scored ${data.score}/100 QOI on Loopgate`
      );

    case "battle_update":
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Battle Update</p>
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #fff;">${data.title || "Your battle needs attention"}</h2>
        <p style="color: #aaa; font-size: 14px; margin: 0;">${data.message || ""}</p>
        <a href="https://loopgate.io/arena" style="${ctaStyle}">Go to Arena →</a>
        `,
        data.title || "Battle update on Loopgate"
      );

    case "battle_result":
      const won = data.won;
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Battle Result</p>
        <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 900; color: ${won ? "#22c55e" : "#ef4444"};">
          ${won ? "🏆 YOU WON!" : "You lost this one"}
        </h2>
        <p style="color: #aaa; font-size: 14px; margin: 0;">
          vs <strong style="color: #fff;">@${data.opponent_username || "opponent"}</strong>
          ${data.score ? ` — Score: ${data.score}` : ""}
        </p>
        <a href="https://loopgate.io/battle/${data.battle_id || ""}" style="${ctaStyle}">View Result →</a>
        `,
        won ? "You won your battle on Loopgate! 🏆" : "Battle result on Loopgate"
      );

    case "new_drop":
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">🔥 New Drop</p>
        <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; color: #fff;">${data.song_name || "New Song"}</h2>
        <p style="color: #aaa; font-size: 14px; margin: 0;">
          by <strong style="color: #facc15;">${data.artist_name || "Featured Artist"}</strong>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 8px;">
          Submit your edit and get rated by judges. ${data.xp_reward ? `+${data.xp_reward} XP reward.` : ""}
        </p>
        <a href="https://loopgate.io/drops" style="${ctaStyle}">Submit Your Edit →</a>
        `,
        `New drop: ${data.song_name || "Featured Song"} — submit your edit`
      );

    case "connection_request":
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Connection Request</p>
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #fff;">
          @${data.sender_username || "someone"} wants to connect
        </h2>
        <a href="https://loopgate.io/network" style="${ctaStyle}">View Request →</a>
        `,
        `@${data.sender_username || "Someone"} wants to connect on Loopgate`
      );

    case "connection_accepted":
      return wrap(
        `
        <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Connection Accepted</p>
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 800; color: #fff;">
          @${data.accepter_username || "someone"} accepted your request!
        </h2>
        <a href="https://loopgate.io/editor/${data.accepter_id || ""}" style="${ctaStyle}">View Profile →</a>
        `,
        `@${data.accepter_username || "Someone"} connected with you on Loopgate`
      );

    default:
      return wrap(
        `<p style="color: #aaa;">You have a new notification on Loopgate.</p>
        <a href="https://loopgate.io" style="${ctaStyle}">Open Loopgate →</a>`,
        "Notification from Loopgate"
      );
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email_type, data } = (await req.json()) as EmailRequest;

    if (!user_id || !email_type) {
      return new Response(JSON.stringify({ error: "Missing user_id or email_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user profile with notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_email, email, notify_scores, notify_battles, notify_drops, notify_connections, username")
      .eq("id", user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine email address (notification_email takes priority over auth email)
    const toEmail = profile.notification_email || profile.email;
    if (!toEmail) {
      return new Response(JSON.stringify({ error: "No email configured", skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check notification preference
    const prefKey = PREFERENCE_MAP[email_type];
    if (prefKey && profile[prefKey] === false) {
      return new Response(JSON.stringify({ skipped: true, reason: "User disabled this notification type" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 1 email of same type per 5 minutes per user
    const { data: recentEmails } = await supabase
      .from("email_notifications_log")
      .select("id")
      .eq("user_id", user_id)
      .eq("email_type", email_type)
      .gte("sent_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1);

    if (recentEmails && recentEmails.length > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "Rate limited" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build and send email
    const { subject, html } = buildEmail(email_type, data);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Loopgate <notifications@loopgate.io>",
        to: [toEmail],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    // Log the email
    await supabase.from("email_notifications_log").insert({
      user_id,
      email_type,
      subject,
      resend_id: resendData?.id || null,
    });

    return new Response(JSON.stringify({ success: true, id: resendData?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Email notification error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
