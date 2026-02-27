

# Solo Edit Detail View — "Gladiator Mode"

## Overview
Build a full-screen, AAA-grade detail view for solo submissions where users can watch edits, upvote/downvote, comment, and add custom thumbnails. Each solo card in the Arena becomes tappable, opening a cinematic detail page.

---

## Database Changes

### 1. New table: `solo_submission_votes`
- `id` (uuid, PK)
- `submission_id` (uuid, FK to solo_submissions)
- `user_id` (uuid)
- `vote_type` (text: 'up' or 'down')
- `created_at` (timestamptz)
- Unique constraint on `(submission_id, user_id)` — one vote per user per submission

### 2. New columns on `solo_submissions`
- `upvotes` (int, default 0)
- `downvotes` (int, default 0)
- `comment_count` (int, default 0)

### 3. Triggers
- **Sync vote counts**: On insert/delete/update of `solo_submission_votes`, recalculate `upvotes` and `downvotes` on the parent `solo_submissions` row (same pattern as `featured_submission_votes`)

### 4. Extend `feed_comments`
- Add `'solo'` as a valid `submission_type` value — no schema change needed since the column is text. The `FeedInlineComments` component's TypeScript type just needs updating.

### 5. RLS Policies
- `solo_submission_votes`: Anyone authenticated can insert/delete their own votes. Anyone can read.
- Existing `solo_submissions` policies remain; new columns are just counters.

### 6. Enable realtime on `solo_submission_votes`

---

## Frontend Changes

### 1. New route: `/solo/:id`
Register in `App.tsx`.

### 2. New page: `SoloDetailPage.tsx`
A cinematic "gladiator mode" detail view:

**Header Section**
- Large 16:9 thumbnail/video area with the theme overlaid as a cinematic title
- "Watch Edit" button linking to the submission URL
- Status badge (EDITING / SUBMITTED / SCORED) with QOI score display

**Editor Profile Bar**
- Avatar, username, song name, artist, theme badge
- Timestamp

**Voting Section**
- Large upvote/downvote buttons with counts, styled with gold accents
- Animated vote feedback (scale + glow)

**Thumbnail Upload**
- If the submission belongs to the current user AND `thumbnail_url` is null, show an upload prompt
- Use Supabase Storage bucket for solo thumbnails
- Update `solo_submissions.thumbnail_url` on upload

**Comments Section**
- Reuse existing `FeedInlineComments` component with `submissionType: 'solo'`
- Shows below the vote section

**Score Breakdown** (if scored)
- Quality / Originality / Impact pillar bars
- Total QOI score with Index awarded

### 3. Update `SoloShowcase.tsx`
- Make each `SoloCard` clickable — wrap in `Link to={/solo/${solo.id}}`
- Show upvote/downvote counts on the card (small icons)
- Show comment count badge

### 4. Update `FeedInlineComments.tsx`
- Add `'solo'` to the `submissionType` union type

### 5. Thumbnail Upload Component
- Small inline component on the detail page
- Uses camera icon + file input
- Uploads to `solo-thumbnails` storage bucket
- Updates the `thumbnail_url` column on the submission

---

## Technical Details

```text
Route: /solo/:id
  +--------------------------------------------------+
  |  [16:9 Thumbnail / Theme Visual]                 |
  |   RAGE EDIT                                      |
  |                           [Watch Edit ->]        |
  +--------------------------------------------------+
  |  [Avatar] @username  |  Song Name  |  7h ago     |
  +--------------------------------------------------+
  |  [Upload Thumbnail] (owner only, if missing)     |
  +--------------------------------------------------+
  |     [Upvote]  42   |   [Downvote]  3             |
  +--------------------------------------------------+
  |  QOI: 87/100                                     |
  |  Quality [====---] 25/30                         |
  |  Originality [=====--] 30/35                     |
  |  Impact [======-] 32/35                          |
  +--------------------------------------------------+
  |  Comments (12)                                   |
  |  [Existing FeedInlineComments component]         |
  +--------------------------------------------------+
```

### Storage
- Create `solo-thumbnails` bucket (public read, auth write)
- File path: `{user_id}/{solo_id}.webp`

### Vote Hook: `useSoloVote(submissionId)`
- Fetches current user's vote and total counts
- `vote(type)` — upserts or removes vote
- Real-time subscription for live count updates

