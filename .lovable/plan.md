

# Loopgate Studio — Quick Edit Toolkit + Software Launcher

## The Problem
Editors leave Loopgate to go edit, and often don't come back to submit. The goal isn't to build a full NLE (that would take years) — it's to keep editors inside the ecosystem and make submitting as frictionless as possible.

## The Solution: `/studio` — A Creative Toolkit Page
A single page at `/studio` that combines three things:

### 1. Quick Clip Editor (Browser-Based)
A lightweight tool for fast edits directly in the browser:
- **Upload a clip** (or use a battle/competition's provided source material)
- **Trim** start/end points with a visual waveform scrubber
- **Add text overlays** (title cards, captions) with preset styles matching Loopgate aesthetic
- **Apply filters** (contrast, saturation, color grading presets like "Cinematic", "Phonk", "Noir")
- **Add music** from a small built-in library or upload their own (using the existing audio trimmer)
- **Export as WebM** and directly submit to an active competition/battle from the export screen

This uses the Web Audio API + Canvas + MediaRecorder pattern already proven in the Upscaler page.

### 2. Software Quick-Launch Cards
Beautiful cards for popular editing software with deep links:
- **CapCut** — opens CapCut app or web editor
- **DaVinci Resolve** — link to download (free)
- **Adobe Premiere Pro** — link to Adobe Creative Cloud
- **After Effects** — link to Adobe
- **Final Cut Pro** — App Store link
- **VN Video Editor** — mobile app stores

Each card shows: logo, "Free" or "Paid" badge, platforms (iOS/Android/Desktop), and a "Start Editing" button. On mobile, these deep-link directly into the apps.

### 3. Submit Shortcut
A prominent "Ready to Submit?" section at the top that shows:
- Active competitions/battles the user can submit to
- Direct upload button that routes to the submission flow
- Links to the user's draft submissions if any exist

## Technical Plan

### New Files
1. **`src/pages/loopgate/StudioPage.tsx`** — Main page with three sections:
   - Submit shortcut bar (active comps)
   - Quick Clip Editor (canvas-based trim + filters + text)
   - Software launcher cards grid

2. **`src/components/loopgate/QuickClipEditor.tsx`** — The browser-based editor component:
   - Video upload + canvas preview
   - Trim handles (start/end markers on a timeline bar)
   - Filter selector (CSS filter presets applied via canvas)
   - Text overlay input (positioned via drag on canvas)
   - Export button using MediaRecorder (same pattern as UpscalerPage)

3. **`src/components/loopgate/SoftwareLauncherGrid.tsx`** — Grid of editing software cards with icons, badges, and deep links

### Modified Files
4. **`src/App.tsx`** — Add route: `/studio` pointing to StudioPage
5. **`src/pages/loopgate/HomePage.tsx`** or Hub — Add a "Studio" entry point card

### No Database Changes Required
This is entirely client-side. No new tables, no storage buckets, no edge functions. The export flow reuses the existing submission modal/flow.

### Key UX Details
- The Quick Clip Editor is intentionally simple — trim, filter, text, export. No multi-track timeline, no keyframes. Think "Instagram Reels editor" level.
- Export outputs WebM via MediaRecorder (same as Upscaler)
- After export, a "Submit to Competition" button appears showing active events
- Software launcher cards detect mobile vs desktop and show appropriate download links
- Sharp-corner design language throughout (no rounded corners)
- Gold accent colors consistent with the rest of Loopgate

