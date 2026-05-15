import { supabase } from "@/integrations/supabase/client";

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

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-stream-upload`;

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", fileType);
    xhr.setRequestHeader("x-file-name", xFileName);
    xhr.setRequestHeader("x-file-type", fileType);
    if (opts?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress!(Math.min(0.98, e.loaded / e.total));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (!json.url) return reject(new Error(json.error || "Upload failed"));
          opts?.onProgress?.(1);
          resolve({
            url: json.url,
            guid: json.guid,
            mp4Url: json.mp4Url,
            thumbnailUrl: json.thumbnailUrl,
            previewUrl: json.previewUrl,
            path: json.path || "",
          });
        } catch (e) {
          reject(new Error("Bad upload response"));
        }
      } else {
        let message = xhr.responseText || xhr.statusText;
        try { message = JSON.parse(xhr.responseText)?.error || message; } catch {}
        reject(new Error(`Upload ${xhr.status}: ${message}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });
}