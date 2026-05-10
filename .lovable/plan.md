
# Collabs Mode — Arena Feature Launch

A new Arena mode where 2 editors team up, split a track between them (e.g. 10s + 10s = 20s), upload one combined edit with both approving, and the community fires emoji reactions. Top collabs each day get massive XP + Index payouts to drive daily collab habit.

## How It Works (User Story)

1. **Create or Join** — Editor opens Arena → Collabs tab. Either:
   - Browse the **open lobby** of unfilled collab slots (someone posted "looking for partner")
   - Create a new collab slot (pick song, total duration, your half's character/scene/timing)
   - Send a **direct invite** to a connection
2. **Lock the brief** — Once paired, both editors see the shared brief: song, total duration, who edits which half (character/scene + timing window: 0–10s vs 10–20s).
3. **Edit + Upload** — Either partner uploads the final stitched edit (one of them assembles both halves). Status flips to "Pending co-approval".
4. **Co-approval gate** — The other partner gets a notification, reviews, hits **Approve** or **Request Changes**. Only when both approve does it go live.
5. **Community fire** — Live collabs appear in the Collabs feed. Anyone can fire emoji reactions (🔥 ⚡ 💎 👑 🎬). Each emoji = weighted reaction score.
6. **Daily Top Collabs** — Leaderboard resets every 24h (UTC). Top 3 collabs by reaction score win:
   - **#1**: 7× normal XP + 7× Index Power to BOTH editors
   - **#2**: 5× to both
   - **#3**: 3× to both
   - All others get 1.5× participation bonus

## Database

New tables (all under `public`, RLS enabled):

- **`collab_slots`** — open lobby + active collabs
  - `creator_id`, `creator_username`, `creator_avatar_url`
  - `partner_id` (nullable until filled), `partner_username`, `partner_avatar_url`
  - `song_title`, `song_artist`, `song_url` (optional Deezer/Spotify ref)
  - `total_duration_seconds` (10–60), `creator_segment` (e.g. "0-10s, character: Goku"), `partner_segment`
  - `status`: `open` | `paired` | `editing` | `pending_approval` | `live` | `rejected` | `expired`
  - `final_video_url` (nullable), `uploaded_by` (nullable)
  - `creator_approved`, `partner_approved` (booleans)
  - `created_at`, `paired_at`, `uploaded_at`, `live_at`, `expires_at` (open slots auto-expire after 7 days)

- **`collab_invites`** — direct invites to connections
  - `slot_id`, `from_user_id`, `to_user_id`, `status` (`pending` | `accepted` | `declined`), `created_at`

- **`collab_reactions`** — emoji fire reactions
  - `slot_id`, `user_id`, `emoji` (constrained to fire/zap/diamond/crown/clapper)
  - unique on `(slot_id, user_id, emoji)` — one of each emoji per user per collab
  - trigger increments cached `reaction_score` on `collab_slots`

- **`collab_daily_winners`** — archived daily top 3 (for prestige history)
  - `date`, `place` (1–3), `slot_id`, `xp_awarded`, `index_awarded`

Triggers:
- Auto-set `paired_at` when `partner_id` fills.
- Auto-set `live_at` when both `*_approved` flip true.
- Auto-expire open slots via cron (`pg_cron` daily sweep).
- Daily 00:00 UTC cron job → compute top 3 by reaction_score from past 24h, insert winners, dispatch XP/Index payouts via existing economy functions.

## Frontend

New files:
- `src/hooks/useCollabs.ts` — fetch open lobby, my collabs, live feed, daily leaderboard. Realtime subscription on `collab_slots` + `collab_reactions`.
- `src/pages/loopgate/CollabsPage.tsx` — 3 tabs: **Lobby** (open slots), **Live** (community feed), **Top Today** (leaderboard).
- `src/pages/loopgate/CollabDetailPage.tsx` — slot detail: brief, partners, video player, emoji rail, approval buttons (only visible to the two editors).
- `src/pages/loopgate/CreateCollabPage.tsx` — form: song picker (reuse Deezer search), duration slider, your half brief (timing + character/scene text).
- `src/components/loopgate/collabs/CollabSlotCard.tsx` — card style: split avatar (creator left, partner right or empty silhouette with "JOIN" CTA), song title, duration, status pill.
- `src/components/loopgate/collabs/CollabEmojiRail.tsx` — 5 emoji buttons with counters, haptic + sound on tap.
- `src/components/loopgate/collabs/CollabApprovalGate.tsx` — shown to editors when status = `pending_approval`.
- `src/components/loopgate/collabs/DailyCollabsLeaderboard.tsx` — top 3 podium, both editors shown side by side.

Wiring:
- Add `/collabs`, `/collabs/create`, `/collab/:id` routes in `App.tsx`.
- Add **Collabs** entry to Arena's main grid (`ArenaPage.tsx`) — purple/violet themed card to differentiate from solo/battles, with "NEW" badge.
- Add notification routes (reuse existing notification system): pair-found, upload-ready-for-approval, you-won-daily.

## Visual Direction

Following the Director Design Sys + Cinematic Atmosphere memory:
- Pure black bg, glassmorphic cards.
- Collabs accent color: **violet** (`hsl(270 80% 60%)`) — unused elsewhere, makes Collabs visually distinct from amber battles, emerald arena, red cash battles.
- Slot cards: split-avatar layout (two faces stitched diagonally) to immediately read as "duo".
- Daily leaderboard podium uses Teko font for the "TOP COLLABS TODAY" header.
- Status pills: OPEN (violet outline), PAIRED (violet solid), EDITING (amber pulse), LIVE (green LIVE dot), TOP 3 (gold).

## Rewards Logic

Hooked into existing XP + Index economy:
- Base reward on going live: 50 XP + 25 Index per editor (1× baseline).
- Daily winners get multipliers applied to their base + a bonus pool:
  - #1: +500 XP + 250 Index each
  - #2: +300 XP + 150 Index each
  - #3: +150 XP + 75 Index each
- All non-winning live collabs that day: +25 XP "participation" bonus.
- Streak bonus: 3 days in a row collabing → +100 Index "Collab Streak" badge unlock (deferred to v2, mention in roadmap).

## Out of Scope (v1)

- Auto-stitching two separate halves server-side (keeping it simple: one editor stitches & uploads).
- Live co-editing in Studio (just async coordination).
- 3+ person collabs (locked to pairs for now).
- Collab-only crew leaderboards (deferred).

## Build Order

1. **DB migration** — all 4 tables + triggers + RLS + cron job.
2. **`useCollabs` hook** — data layer.
3. **Collabs landing page** with 3 tabs + slot cards.
4. **Create flow** + lobby joining.
5. **Detail page** with approval gate + emoji rail.
6. **Daily leaderboard cron + payout edge function**.
7. **Arena entry card** + notifications wiring.
8. **NDA / activity-optics check** — hide zero metrics, no unannounced partner refs.

Approve and I'll start with the migration, then build the UI in passes so you can preview as it lands.
