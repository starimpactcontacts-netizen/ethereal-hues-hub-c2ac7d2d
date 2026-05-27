## Goal
Make "Forgot password?" actually send a real branded recovery email via Resend (same way `send-login-email` already works), instead of relying on Supabase's default `resetPasswordForEmail` (which doesn't deliver because no Lovable sender domain is configured).

The existing `/reset-password` page already handles the rest: it listens for `PASSWORD_RECOVERY`, reads `sessionStorage.loopgate_pending_pw`, and silently calls `supabase.auth.updateUser({ password })` — so once the user clicks the email link, their new password is applied and they land on `/hub`. No changes needed there.

## Changes

### 1. New edge function: `supabase/functions/send-password-reset/index.ts`
- Accepts `{ email, redirectTo }`.
- Uses service-role client to call `supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })`.
- If the user doesn't exist, return a generic success (don't leak account existence).
- Builds a branded HTML email matching the existing `send-login-email` style (LOOPGATE header, dark theme, big "Reset password & sign in" button pointing at `action_link`).
- Sends via `Resend` using `RESEND_API_KEY` (already in secrets) from `Loopgate <noreply@loopgate.io>` — same sender pattern used in other functions.
- Returns `{ success: true }`. CORS handled like the other functions.
- Configured with `verify_jwt = false` in `supabase/config.toml` (public endpoint, like `send-login-email`).

### 2. `src/pages/LoginPage.tsx` — `handleForgotPassword`
Replace the `supabase.auth.resetPasswordForEmail(...)` call with:
```ts
sessionStorage.setItem('loopgate_pending_pw', forgotNewPw);
const { error } = await supabase.functions.invoke('send-password-reset', {
  body: { email, redirectTo: `${window.location.origin}/reset-password` },
});
```
Everything else (validation, loading state, `forgotSent` confirmation UI) stays as-is.

### 3. `supabase/config.toml`
Add a block for the new function with `verify_jwt = false` so it can be called from the public login page without a session.

## Why this works
- Resend is already proven on this project (`send-login-email`, `send-notification-email`, etc.) using the same `RESEND_API_KEY`.
- `auth.admin.generateLink({ type: 'recovery' })` produces a real Supabase recovery URL — clicking it fires `PASSWORD_RECOVERY` on `/reset-password`, which the existing page already handles to apply the stashed password and log the user in.
- No Lovable email-domain setup or template scaffolding required.

## Out of scope
- No DB changes.
- No UI redesign of the forgot-password panel.
- No changes to `/reset-password` page.