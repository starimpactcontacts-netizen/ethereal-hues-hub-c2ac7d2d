/**
 * Unified Thumbnail Resolution System for Loopgate
 * 
 * Priority: manual → auto (DB) → platform fallback → global placeholder
 * 
 * thumbnailStatus values:
 *   "manual"             – user-uploaded thumbnail
 *   "auto"               – auto-generated frame or DB-stored thumb
 *   "fallback_youtube"   – resolved from YouTube img API
 *   "fallback_tiktok"    – resolved via edge function
 *   "fallback_instagram" – resolved via edge function
 *   "error"              – all methods failed, using placeholder
 */

import { supabase } from '@/integrations/supabase/client';
import loopgateLogo from '@/assets/loopgate-logo.png';

// ── Types ──────────────────────────────────────────────────────────

export type ThumbnailStatus =
  | 'manual'
  | 'auto'
  | 'fallback_youtube'
  | 'fallback_tiktok'
  | 'fallback_instagram'
  | 'error';

export interface ThumbnailResult {
  url: string;
  status: ThumbnailStatus;
  sourceUrl: string | null; // the URL used to derive the thumbnail
}

// ── Constants ──────────────────────────────────────────────────────

export const LOOPGATE_PLACEHOLDER = loopgateLogo;

const YT_REGEX =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

// ── Cache ──────────────────────────────────────────────────────────

const cache = new Map<string, ThumbnailResult>();

/** Invalidate a cached thumbnail (e.g. when user uploads a new one) */
export function invalidateThumbnailCache(submissionUrl: string) {
  cache.delete(submissionUrl);
}

/** Clear entire cache */
export function clearThumbnailCache() {
  cache.clear();
}

// ── Core resolver ──────────────────────────────────────────────────

/**
 * Resolve a thumbnail for a submission following the strict priority chain.
 *
 * @param submissionUrl  – the video URL
 * @param platform       – tiktok | instagram | youtube
 * @param manualThumb    – user-uploaded thumbnail URL (highest priority)
 * @param dbThumb        – thumbnail_url stored in the database row
 */
export function getThumbnail(
  submissionUrl: string,
  platform: string,
  manualThumb?: string | null,
  dbThumb?: string | null,
): ThumbnailResult {
  // 1. Manual user thumbnail
  if (manualThumb) {
    const result: ThumbnailResult = { url: manualThumb, status: 'manual', sourceUrl: manualThumb };
    cache.set(submissionUrl, result);
    return result;
  }

  // 2. DB-stored auto thumbnail
  if (dbThumb) {
    const result: ThumbnailResult = { url: dbThumb, status: 'auto', sourceUrl: submissionUrl };
    cache.set(submissionUrl, result);
    return result;
  }

  // Check cache
  if (cache.has(submissionUrl)) {
    return cache.get(submissionUrl)!;
  }

  // 3. Platform-specific instant resolution (client-side, no network)
  const instant = resolveInstantPlatformThumb(submissionUrl, platform);
  if (instant) {
    cache.set(submissionUrl, instant);
    return instant;
  }

  // If we can't resolve instantly, return placeholder; async resolution happens via getThumbnailAsync
  return { url: LOOPGATE_PLACEHOLDER, status: 'error', sourceUrl: submissionUrl };
}

/** Instant client-side resolution (YouTube only — no network) */
function resolveInstantPlatformThumb(url: string, platform: string): ThumbnailResult | null {
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(YT_REGEX);
    if (match) {
      return {
        url: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
        status: 'fallback_youtube',
        sourceUrl: url,
      };
    }
  }
  return null;
}

// ── Async resolver (for TikTok/Instagram via edge function) ────────

/**
 * Async thumbnail resolution for platforms that need a server call.
 * Returns a ThumbnailResult; caller should update state with it.
 */
export async function getThumbnailAsync(
  submissionUrl: string,
  platform: string,
  manualThumb?: string | null,
  dbThumb?: string | null,
): Promise<ThumbnailResult> {
  // Re-check sync first
  const sync = getThumbnail(submissionUrl, platform, manualThumb, dbThumb);
  if (sync.status !== 'error') return sync;

  // Check cache (may have been populated by a parallel call)
  if (cache.has(submissionUrl) && cache.get(submissionUrl)!.status !== 'error') {
    return cache.get(submissionUrl)!;
  }

  // Call edge function
  try {
    const { data } = await supabase.functions.invoke('get-video-thumbnail', {
      body: { url: submissionUrl, platform },
    });

    if (data?.thumbnailUrl) {
      const status: ThumbnailStatus =
        platform === 'tiktok' ? 'fallback_tiktok' :
        platform === 'instagram' ? 'fallback_instagram' :
        'auto';
      const result: ThumbnailResult = { url: data.thumbnailUrl, status, sourceUrl: submissionUrl };
      cache.set(submissionUrl, result);
      return result;
    }
  } catch (e) {
    console.warn('[Thumbnail] Edge function failed for', submissionUrl, e);
  }

  // Global fallback
  const fallback: ThumbnailResult = { url: LOOPGATE_PLACEHOLDER, status: 'error', sourceUrl: submissionUrl };
  cache.set(submissionUrl, fallback);
  return fallback;
}

// ── Batch resolver (for feed pages) ────────────────────────────────

export interface BatchInput {
  submission_url: string;
  platform: string;
  manual_thumb?: string | null;
  db_thumb?: string | null;
}

/**
 * Batch resolve thumbnails. Resolves sync first, then fetches remaining async
 * with concurrency limit.
 */
export async function getThumbnailBatch(
  items: BatchInput[],
  concurrency = 6,
): Promise<Map<string, ThumbnailResult>> {
  const results = new Map<string, ThumbnailResult>();
  const needsAsync: BatchInput[] = [];

  // Phase 1: sync resolution
  for (const item of items) {
    const sync = getThumbnail(item.submission_url, item.platform, item.manual_thumb, item.db_thumb);
    results.set(item.submission_url, sync);
    if (sync.status === 'error') {
      needsAsync.push(item);
    }
  }

  // Phase 2: async resolution in batches
  for (let i = 0; i < needsAsync.length; i += concurrency) {
    const batch = needsAsync.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(item => getThumbnailAsync(item.submission_url, item.platform)),
    );
    for (let j = 0; j < settled.length; j++) {
      if (settled[j].status === 'fulfilled') {
        results.set(batch[j].submission_url, (settled[j] as PromiseFulfilledResult<ThumbnailResult>).value);
      }
    }
  }

  return results;
}

// ── React hook ─────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

/**
 * React hook wrapping getThumbnail + async fallback.
 * Drop-in replacement for the old useThumbnail hook.
 */
export function useUnifiedThumbnail(
  submissionUrl: string,
  platform: string,
  manualThumb?: string | null,
  dbThumb?: string | null,
): ThumbnailResult {
  const sync = getThumbnail(submissionUrl, platform, manualThumb, dbThumb);
  const [result, setResult] = useState<ThumbnailResult>(sync);

  useEffect(() => {
    if (!submissionUrl) return;

    const sync = getThumbnail(submissionUrl, platform, manualThumb, dbThumb);
    if (sync.status !== 'error') {
      setResult(sync);
      return;
    }

    let cancelled = false;
    getThumbnailAsync(submissionUrl, platform, manualThumb, dbThumb).then(r => {
      if (!cancelled) setResult(r);
    });
    return () => { cancelled = true; };
  }, [submissionUrl, platform, manualThumb, dbThumb]);

  return result;
}
