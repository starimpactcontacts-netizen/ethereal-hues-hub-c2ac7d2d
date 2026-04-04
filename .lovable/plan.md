
# Competitions System Full Rebuild

## Phase 1: New Database Table
Create a new `competitions` table with open-lobby model:
- `id`, `name`, `description`, `theme` (replaces song_name)
- `creator_id`, `creator_username`, `creator_avatar_url`
- `league` (open/pro/elite), `scoring_mode` (judged/community)
- `max_players` (2-100), `current_players` (synced via trigger)
- `cover_image_url`, `status` (lobby → live → judging → completed)
- `started_at` (null until host clicks Start), `deadline` (set when started, 24h window)
- `index_reward_pool`, `slug`
- RLS: public read, authenticated insert/update own

Create `competition_participants` table:
- `competition_id`, `user_id`, `username`, `avatar_url`, `joined_at`
- Trigger to sync `current_players` count

Create `competition_submissions` table:
- `competition_id`, `user_id`, `username`, `submission_url`, `platform`
- `score`, `judge_notes`, `is_winner`, `winner_place`

## Phase 2: Delete Old Code (~35 files touching hosted_comp)
- Delete pages: `HostedCompsPage`, `HostedCompDetailPage`
- Delete components: `HostedCompHostDashboard`, `HostedCompChat`, `HostedCompJoinButton`, `HostedCompActivitySignals`, `HostedCompLeaderboard`, `HostedCompManagement`, `CompLobbyHeader`, `ProposeHostedCompModal`, `CreateCompetitionModal`, `HostAvatarUploadModal`
- Delete hooks: `useHostedCompetitions`
- Remove routes from `App.tsx`
- Clean up `ArenaPage.tsx` references

## Phase 3: New Frontend
- **ArenaCompetitionsSection** — Redesigned card carousel (already started)
- **CompetitionLobbyPage** — New detail page with lobby/live states, host Start button
- **CreateCompetitionSheet** — Bottom sheet for quick competition creation
- **CompetitionChat** — Lightweight chat for lobby
- New hook: `useCompetitions`

## Phase 4: Wire up
- Route: `/competition/:id` for lobby/detail
- Route: `/competition/create` for creation
- Arena section fetches from new `competitions` table
