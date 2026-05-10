---
name: Collabs Mode
description: Arena duo edit mode — paired editors split a track, dual-approve upload, emoji reactions, daily top 3 win 5k XP + 1k Index each
type: feature
---
- Tables: `collab_slots`, `collab_invites`, `collab_reactions` (fire/zap/diamond/crown/clapper, weights 1/1/2/3/1), `collab_daily_winners`.
- Status flow: open → paired → editing → pending_approval → live (auto via `trg_collab_slot_lifecycle`). Both `*_approved` true → live.
- Uploader auto-approves their own upload; partner approves to go live.
- `collab_recompute_score` keeps `reaction_score` cached on slots.
- Routes: `/collabs`, `/collabs/create`, `/collab/:id`. Arena entry card under Quick Actions in `ArenaPage.tsx`.
- Daily payout: `public.award_daily_collabs()` runs via pg_cron `award-daily-collabs` at 00:05 UTC. #1=5000xp+1000idx, #2=3000+600, #3=1500+300 to BOTH editors.
- Accent color: violet (rgba(168,85,247,*)). Distinct from amber battles, emerald arena, red cash battles.
