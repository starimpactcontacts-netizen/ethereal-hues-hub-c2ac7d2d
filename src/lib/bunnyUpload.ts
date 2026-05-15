import { supabase } from "@/integrations/supabase/client";

export interface UploadOpts {
  folder?: string;
  fileName?: string;
  /** 0..1 progress callback fired during the PUT to Bunny */
  onProgress?: (pct: number) => void;
}

/**
 * Upload to Bunny via the `bunny-upload` edge function proxy.
 *
 * NOTE: We can't PUT directly to storage.bunnycdn.com from the browser —
 * Bunny Storage does not return CORS headers, so the preflight blows up.
 * Instead we stream the file body to our edge function which forwards it to
 * Bunny server-side. We use XHR so we still get real upload progress.
 */
export async function uploadToBunny(
  file: File | Blob,
  opts?: UploadOpts,
): Promise<{ url: string; path: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const inferredName =
    opts?.fileName ||
    (file instanceof File ? file.name : `upload-${Date.now()}.bin`);
  const fileType = (file as File).type || "application/octet-stream";
  const folder = (opts?.folder || "").replace(/^\/+|\/+$/g, "");
  const xFileName = folder ? `${folder}/${inferredName}` : inferredName;

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-upload`;

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Content-Type", fileType);
    xhr.setRequestHeader("x-file-name", xFileName);
    xhr.setRequestHeader("x-file-type", fileType);
    if (opts?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress!(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (!json.url) return reject(new Error(json.error || "Upload failed"));
          resolve({ url: json.url, path: json.path });
        } catch (e) {
          reject(new Error("Bad upload response"));
        }
      } else {
        reject(new Error(`Upload ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });
}