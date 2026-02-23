import { z } from 'zod';

// Platform URL validation schemas
const tiktokUrlSchema = z.string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && 
               (parsed.hostname.includes('tiktok.com') || parsed.hostname.includes('vm.tiktok.com'));
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid TikTok URL (https://tiktok.com/...)' }
  );

const instagramUrlSchema = z.string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname.includes('instagram.com');
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid Instagram URL (https://instagram.com/...)' }
  );

const youtubeUrlSchema = z.string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && 
               (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be'));
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid YouTube URL (https://youtube.com/... or https://youtu.be/...)' }
  );

export type PlatformType = 'tiktok' | 'instagram' | 'youtube';

export function validatePlatformUrl(platform: PlatformType, url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    switch (platform) {
      case 'tiktok':
        tiktokUrlSchema.parse(url);
        break;
      case 'instagram':
        instagramUrlSchema.parse(url);
        break;
      case 'youtube':
        youtubeUrlSchema.parse(url);
        break;
    }
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Invalid URL' };
    }
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function getPlatformUrlPlaceholder(platform: PlatformType): string {
  switch (platform) {
    case 'tiktok':
      return 'https://tiktok.com/@handle/video/...';
    case 'instagram':
      return 'https://instagram.com/reel/...';
    case 'youtube':
      return 'https://youtube.com/shorts/...';
  }
}

export function detectPlatform(url: string): PlatformType | null {
  // Normalize: add protocol if missing so URL parsing works
  let normalizedUrl = url.trim();
  if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//i)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  // Also do a simple substring check for short/mobile links that may not parse cleanly
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok') || lower.includes('vt.tiktok')) return 'tiktok';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.hostname.includes('tiktok.com')) return 'tiktok';
    if (parsed.hostname.includes('instagram.com')) return 'instagram';
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) return 'youtube';
  } catch {
    return null;
  }
  return null;
}
