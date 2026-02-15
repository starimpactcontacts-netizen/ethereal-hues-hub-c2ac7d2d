import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API (no external deps)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return saltHex + ':' + hashHex;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, email, password, otp, token } = await req.json();

    // ─── SIGNUP with password ───
    if (action === "signup") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from("enterprise_clients")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "An account with this email already exists. Try signing in." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const hashed = await hashPassword(password);
      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { data: client, error } = await supabase
        .from("enterprise_clients")
        .insert({
          email: email.toLowerCase(),
          password_hash: hashed,
          session_token: sessionToken,
          session_expires_at: expiresAt.toISOString(),
        })
        .select("id, email")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        client: { id: client.id, email: client.email },
        token: sessionToken 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── SIGNIN with password ───
    if (action === "signin") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: client } = await supabase
        .from("enterprise_clients")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (!client || !client.password_hash) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const valid = await verifyPassword(password, client.password_hash);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await supabase
        .from("enterprise_clients")
        .update({ session_token: sessionToken, session_expires_at: expiresAt.toISOString() })
        .eq("id", client.id);

      return new Response(JSON.stringify({ 
        success: true, 
        client: { id: client.id, email: client.email },
        token: sessionToken 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── SEND OTP (passwordless signin/signup) ───
    if (action === "send-otp") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      // Upsert — creates account if doesn't exist
      const { data: existing } = await supabase
        .from("enterprise_clients")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existing) {
        await supabase
          .from("enterprise_clients")
          .update({ otp_code: otp, otp_expires_at: otpExpires.toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("enterprise_clients")
          .insert({ email: email.toLowerCase(), otp_code: otp, otp_expires_at: otpExpires.toISOString() });
      }

      // Send OTP email using the existing send-login-email pattern
      // For now, log OTP (in production, send via email service)
      console.log(`Enterprise OTP for ${email}: ${otp}`);

      // Try to send via Resend if available
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Loopgate Enterprise <noreply@loopgate.io>",
              to: [email],
              subject: "Your Enterprise Portal Access Code",
              html: `<div style="background:#060606;color:#fff;padding:40px;font-family:sans-serif;text-align:center;">
                <h2 style="color:#E00000;margin-bottom:8px;">LOOPGATE</h2>
                <p style="color:#666;font-size:11px;letter-spacing:3px;margin-bottom:30px;">CLIENT PORTAL</p>
                <p style="font-size:36px;font-weight:bold;letter-spacing:8px;margin:20px 0;">${otp}</p>
                <p style="color:#666;font-size:12px;">This code expires in 10 minutes.</p>
              </div>`
            })
          });
        } catch (e) {
          console.error("Email send failed:", e);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Code sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── VERIFY OTP ───
    if (action === "verify-otp") {
      if (!email || !otp) {
        return new Response(JSON.stringify({ error: "Email and code required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: client } = await supabase
        .from("enterprise_clients")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("otp_code", otp)
        .maybeSingle();

      if (!client) {
        return new Response(JSON.stringify({ error: "Invalid code" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (client.otp_expires_at && new Date(client.otp_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Code expired" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const sessionToken = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await supabase
        .from("enterprise_clients")
        .update({ 
          session_token: sessionToken, 
          session_expires_at: expiresAt.toISOString(),
          otp_code: null, 
          otp_expires_at: null 
        })
        .eq("id", client.id);

      return new Response(JSON.stringify({ 
        success: true, 
        client: { id: client.id, email: client.email },
        token: sessionToken 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── VERIFY SESSION TOKEN ───
    if (action === "verify-session") {
      if (!token) {
        return new Response(JSON.stringify({ authenticated: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: client } = await supabase
        .from("enterprise_clients")
        .select("id, email, display_name, session_expires_at")
        .eq("session_token", token)
        .maybeSingle();

      if (!client || (client.session_expires_at && new Date(client.session_expires_at) < new Date())) {
        return new Response(JSON.stringify({ authenticated: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ 
        authenticated: true, 
        client: { id: client.id, email: client.email, display_name: client.display_name } 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── LOGOUT ───
    if (action === "logout") {
      if (token) {
        await supabase
          .from("enterprise_clients")
          .update({ session_token: null, session_expires_at: null })
          .eq("session_token", token);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Enterprise auth error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
