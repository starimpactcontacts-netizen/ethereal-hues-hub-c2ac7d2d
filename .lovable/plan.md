
# Add GIF Support to Feed Replies + Default "Meme" Category

## Overview
Integrate the existing Tenor GIF picker into all three comment/reply systems across the feed, and change the default category from "reaction" to "meme" across all GIF picker instances.

## Changes

### 1. GifPicker.tsx - Default to "meme" category
- Change the initial `search` state from `"reaction"` to `"meme"`
- This applies globally (DMs, crew chat, and new comment integrations)

### 2. FeedInlineComments.tsx - Add GIF button to inline reply input
- Import `GifPicker` and the `Smile` icon
- Add state: `showGifPicker`
- Add a GIF toggle button next to the send button
- When a GIF is selected, submit it as the comment content (the URL)
- Position the GIF picker above the input area
- Render GIF URLs as inline images in the comment display (detect tenor URLs in `ThreadComment`)

### 3. FeedComments.tsx - Add GIF button to bottom-sheet comment input
- Import `GifPicker` and the `Smile` icon
- Add state: `showGifPicker`
- Add a GIF toggle button in the input area between the avatar and textarea
- When a GIF is selected, submit it as comment content
- Position the picker above the input inside the sheet
- Render GIF URLs as inline images in `CommentItem`

### 4. UnitFeedCommentsSheet.tsx - Add GIF button to unit feed comments
- Import `GifPicker` and the `Smile` icon
- Add state: `showGifPicker`
- Add a GIF toggle button next to the send button
- When a GIF is selected, submit as comment content
- Render GIF URLs as inline images

### 5. GIF Content Rendering (all three components)
- In the comment content display, detect if content is a Tenor GIF URL (contains `tenor.com` or ends with `.gif`)
- If so, render an `<img>` tag instead of text
- This keeps it simple - GIFs are stored as plain URLs in the `content` field, same pattern as DMs

## Technical Details

**GIF detection helper** (inline in each component or shared):
```typescript
const isGifUrl = (text: string) =>
  text.match(/^https?:\/\/.*\.(gif|gifv)(\?.*)?$/i) ||
  text.includes('tenor.com') || text.includes('giphy.com');
```

**Comment content rendering pattern:**
```tsx
{isGifUrl(comment.content) ? (
  <img src={comment.content} alt="GIF" className="max-w-[200px] rounded-lg mt-1" loading="lazy" />
) : (
  <p className="text-sm break-words">{comment.content}</p>
)}
```

**No database changes needed** - GIF URLs are stored as regular text in the existing `content` column of `feed_comments` and `unit_feed_comments` tables.
