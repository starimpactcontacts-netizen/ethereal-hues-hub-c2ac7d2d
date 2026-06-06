---
name: Solo Share
description: Public shareable rating pages — editor drops video URL, gets /s/:slug, anyone (anon-friendly) rates 1-5 stars + comment, editor earns Rings (1 per star, capped 100/page). Built for organic viral acquisition.
type: feature
---
- Tables: `solo_shares` (slug, video_url, platform, title, caption, avg_rating, rings_earned, views), `solo_share_ratings` (stars 1-5, comment, rater_nickname, rater_ip_hash for dedupe).
- Trigger `trg_solo_share_after_rating`: awards profile.rings += stars (capped at 100 total per share), recomputes avg + total.
- RLS: anonymous can SELECT/INSERT ratings; cannot rate own share. Owners CRUD shares only.
- Routes: `/s/:slug` PUBLIC (outside ProtectedRoute), `/solo` (My Solo Pages), `/solo/create`.
- Arena entry: solid white "DROP YOUR EDIT" card directly under Competitions section.
- Embed: client-side `getEmbedUrl()` in `src/lib/videoEmbed.ts` — TikTok, Instagram, YouTube (incl. shorts).
- Branding: every public page = Loopgate top bar + GateIcon + bottom "Create your Solo page" CTA. Every shared link = organic acquisition.
