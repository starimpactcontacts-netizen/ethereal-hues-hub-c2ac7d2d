# VERSUS INSPO — Solo Mode

A new Solo entry where an editor uploads the inspo edit they want to beat, recreates it using the same song, and the platform plays both side-by-side (battle-style) for 24h public voting. Winner takes Rings + Index + XP.

## User flow

1. Solo Hub → new card **VERSUS INSPO** (purple/red diamond, next to SPRINT/STANDARD/CINEMATIC).
2. `/versus/create` — 3 steps:
   - **Upload Inspo Edit** (MP4 to Bunny/Storage, ≤200 MB, ≤90 s).
   - **Lock the Song** — type song name + artist; this is enforced as the song the user must use in their own edit.
   - **Title / Caption**.
3. After create → user is taken to Studio (or simple submit screen) to drop their own version URL (TikTok/IG/YT link or upload).
4. Once user submits their version, status flips `editing` → `voting`, `voting_ends_at = now() + 24h`, battle is live at `/versus/:id`.
5. `/versus/:id` shows inspo (BLUE side, labeled "INSPO") vs user (RED side, labeled their @username) in the existing `BattleAutoplayDuo` component, plus a "WHO DID IT BETTER?" vote panel reusing the look of `BattleShowcase`/cash-battle voting.
6. Voting open 24h. Anyone authed votes once. After 24h, status → `decided`. If creator wins:
   - **+30 Rings**, **+10 Index (global + spendable)**, **+50 XP**.
   - If inspo wins: **+5 XP consolation** (still learned something).
   - If tie: **+10 XP**.
7. `/versus` — public list of live + decided versus battles (carousel on Solo Hub + dedicated page).

## Database

New tables (migration):

- `versus_inspo_battles`
  - `creator_id` → profiles, `creator_username`, `creator_avatar_url`
  - `inspo_video_url` (Bunny HLS or storage), `inspo_thumbnail_url`, `inspo_duration_sec`
  - `song_name`, `song_artist`
  - `title`, `caption`
  - `creator_submission_url`, `creator_submission_platform`, `creator_submission_thumbnail`
  - `status` enum: `editing` | `voting` | `decided` | `cancelled`
  - `voting_started_at`, `voting_ends_at`
  - `creator_votes`, `inspo_votes`, `total_votes`
  - `winner` enum: `creator` | `inspo` | `tie` | null
  - `rings_awarded`, `index_awarded`, `xp_awarded`
  - `views`
- `versus_inspo_votes`
  - `battle_id` → versus_inspo_battles
  - `voter_id` (nullable), `voter_ip_hash`
  - `vote` enum: `creator` | `inspo`
  - UNIQUE (battle_id, voter_id) and UNIQUE (battle_id, voter_ip_hash)

RLS:
- Battles: public SELECT when status in ('voting','decided'); creator full CRUD on own; service_role all.
- Votes: authed users INSERT (cannot vote on own battle, cannot double-vote); SELECT own + aggregates via battle row.
- GRANT block per house rules (authenticated + service_role; anon SELECT on battles only).

Triggers:
- `trg_versus_vote_after_insert` — increments `creator_votes`/`inspo_votes`/`total_votes` on the battle.
- `trg_versus_close` — function `close_due_versus_battles()` called by cron edge function every 5 min: any `voting` row with `voting_ends_at < now()` → compute winner, set `decided`, award Rings/Index/XP to creator, write notification row.

## Storage

New bucket `versus-inspo` (private, signed URLs). 200 MB limit. Path: `{user_id}/{battle_id}/inspo.mp4`. Reuse existing Bunny pipeline if available (`bunny-sign-upload`) — fallback to Supabase storage if Bunny unconfigured.

## Edge function

`close-versus-battles` (cron every 5 min via pg_cron + net.http_post): selects expired voting battles, calls SQL function to close + award. No external deps.

## Frontend files

New:
- `src/hooks/useVersusInspo.ts` — create, submit own version, vote, fetch single, fetch list, realtime.
- `src/pages/loopgate/VersusInspoCreatePage.tsx` — upload inspo + song + title.
- `src/pages/loopgate/VersusInspoBattlePage.tsx` — `/versus/:id`, reuses `BattleAutoplayDuo`, adds 24h countdown, vote panel, "DECIDED" state with winner.
- `src/pages/loopgate/VersusInspoListPage.tsx` — `/versus`, live + decided grid.
- `src/components/loopgate/VersusInspoVotePanel.tsx` — vote UI (creator vs inspo, % bars, locked-in state).
- `src/components/loopgate/VersusInspoCard.tsx` — list/carousel card.

Edited:
- `src/App.tsx` — routes `/versus`, `/versus/create`, `/versus/:id`.
- `src/pages/loopgate/SoloHubPage.tsx` — add VERSUS INSPO entry card + live carousel.
- `src/components/loopgate/SoloModeFlow.tsx` — optional: add a 4th option below 3H Cinematic linking to `/versus/create`.

## Out of scope (this pass)

- No NLE/Studio changes — submission is by link or upload like solo shares.
- No judge scoring — pure public vote (per user's answer).
- No chat on versus pages yet (can reuse `BattleChat` later).

## Acceptance

- Create battle, upload inspo, submit own URL → battle visible at `/versus/:id` with both videos autoplaying side-by-side.
- Vote count increments in realtime; can't double-vote; can't vote on own battle.
- After 24h, status flips to `decided`, winner shown, Rings/Index/XP credited to creator profile.