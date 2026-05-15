import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

export interface UploadOpts {
  folder?: string;
  fileName?: string;
  /** Defaults to 1GB for edit uploads. */
  maxBytes?: number;
  /** 0..1 progress callback fired during the PUT to Bunny */
  onProgress?: (pct: number) => void;
}

export const MAX_EDIT_UPLOAD_BYTES = 1024 * 1024 * 1024;
export const MAX_EDIT_UPLOAD_LABEL = "1GB";

export interface BunnyUploadResult {
  /** Canonical playback URL — HLS playlist for Stream uploads, CDN MP4 for legacy. */
  url: string;
  /** Stream guid (only present for Stream uploads). */
  guid?: string;
  /** Direct MP4 fallback URL (Stream only). */
  mp4Url?: string;
  /** Auto-generated thumbnail (Stream only). */
  thumbnailUrl?: string;
  /** Animated preview webp (Stream only). */
  previewUrl?: string;
  /** Storage path for legacy Storage uploads. Empty string for Stream uploads. */
  path: string;
}

/**
 * Upload a video to **Bunny Stream** via the `bunny-stream-upload` edge function.
 *
 * Bunny Stream gives us:
 *   - Adaptive bitrate HLS playback (instant start, scales to network)
 *   - Auto thumbnails + preview animations
 *   - Proper CDN distribution (no edge-function proxy on every play)
 *
 * Returned `url` is the HLS `.m3u8` playlist — use the `HlsVideo` component or
 * `getBunnyPlaybackUrl()` helper to play it (Safari plays HLS natively, other
 * browsers go through `hls.js`).
 */
export async function uploadToBunny(
  file: File | Blob,
  opts?: UploadOpts,
): Promise<BunnyUploadResult> {
  const maxBytes = opts?.maxBytes ?? MAX_EDIT_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    throw new Error(`File too big — ${MAX_EDIT_UPLOAD_LABEL} max`);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const inferredName =
    opts?.fileName ||
    (file instanceof File ? file.name : `upload-${Date.now()}.bin`);
  const fileType = (file as File).type || "application/octet-stream";
  const folder = (opts?.folder || "").replace(/^\/+|\/+$/g, "");
  const xFileName = folder ? `${folder}/${inferredName}` : inferredName;

  // 1) Ask edge function for a Bunny Stream video slot + TUS signature.
  //    NO bytes flow through Lovable here — only ~1KB metadata.
  const createEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-stream-create`;
  const createRes = await fetch(createEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName: xFileName }),
  });
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Bunny create ${createRes.status}: ${text}`);
  }
  const meta = await createRes.json();
  if (!meta?.guid || !meta?.signature) throw new Error(meta?.error || "Bunny create failed");

  // 2) Upload bytes DIRECTLY to video.bunnycdn.com via TUS. Resumable, parallel
  //    chunks, zero Lovable bandwidth.
  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file as File, {
      endpoint: meta.tusEndpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: 50 * 1024 * 1024, // 50MB chunks
      headers: {
        AuthorizationSignature: meta.signature,
        AuthorizationExpire: String(meta.expirationTime),
        VideoId: meta.guid,
        LibraryId: String(meta.libraryId),
      },
      metadata: {
        filetype: fileType,
        title: inferredName,
      },
      onError: (err) => reject(err),
      onProgress: (sent, total) => {
        if (opts?.onProgress && total) {
          opts.onProgress(Math.min(0.99, sent / total));
        }
      },
      onSuccess: () => {
        opts?.onProgress?.(1);
        resolve();
      },
    });
    upload.start();
  });

  return {
    url: meta.url,
    guid: meta.guid,
    mp4Url: meta.mp4Url,
    thumbnailUrl: meta.thumbnailUrl,
    previewUrl: meta.previewUrl,
    path: "",
  };
}