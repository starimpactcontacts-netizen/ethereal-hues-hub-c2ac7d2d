// Reclaim a username-only anonymous account by setting a password on it.
// Verifies the target profile is a guest (is_guest=true) and has no real email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { username, password } = await req.json();
    const u = String(username || "").trim();
    const pw = String(password || "");
    if (u.length < 3 || !/^[a-zA-Z0-9_]+$/.test(u)) return json({ error: "Invalid username" }, 400);
    if (pw.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, is_guest, email")
      .ilike("username", u)
      .maybeSingle();

    if (!profile) return json({ error: "No account found with that handle" }, 404);
    if (!profile.is_guest) {
      return json({ error: "This account is already secured — log in with your password" }, 409);
    }

    // Get the auth user
    const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(profile.id);
    if (getErr || !authUser?.user) return json({ error: "Account not found" }, 404);

    // Block if it already has a real (non-placeholder) email
    const existingEmail = authUser.user.email || "";
    const isPlaceholder = !existingEmail || existingEmail.endsWith("@loopgate.local");
    if (!isPlaceholder) {
      return json({ error: "This account already has an email — use password reset" }, 409);
    }

    const email = existingEmail || `${profile.username.toLowerCase()}.reclaim@loopgate.local`;

    // Set email + password + confirm
    const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
      email,
      password: pw,
      email_confirm: true,
      user_metadata: { ...(authUser.user.user_metadata || {}), username: profile.username, is_guest: false },
    });
    if (updErr) return json({ error: updErr.message }, 500);

    // Flip profile flag
    await admin.from("profiles").update({ is_guest: false, email }).eq("id", profile.id);

    return json({ ok: true, email, username: profile.username });
  } catch (e) {
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});
