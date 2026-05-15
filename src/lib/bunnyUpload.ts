import { supabase } from "@/integrations/supabase/client";

export interface UploadOpts {
  folder?: string;
  fileName?: string;
  /** 0..1 progress callback fired during the PUT to Bunny */
  onProgress?: (pct: number) => void;
}

/**
 * Direct-to-Bunny upload.
 *
 * Step 1: Edge function `bunny-sign-upload` issues a short-lived PUT target
 *         (auth-gated — only signed-in users get one).
 * Step 2: Browser PUTs the file straight to storage.bunnycdn.com via XHR
 *         so we get real upload progress and skip the proxy hop.
 *
 * Returns the cached CDN URL like https://loop-media.b-cdn.net/<path>.
 * Use for all video uploads. Tiny avatars/logos can stay on Cloud storage.
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

  // 1) Get signed PUT target
  const signRes = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-sign-upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName: inferredName, folder: opts?.folder || "" }),
    },
  );
  if (!signRes.ok) {
    const errText = await signRes.text();
    throw new Error(errText || `Sign failed (${signRes.status})`);
  }
  const { uploadUrl, accessKey, cdnUrl, path } = await signRes.json();

  // 2) Direct PUT to Bunny with progress
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("AccessKey", accessKey);
    xhr.setRequestHeader("Content-Type", fileType);
    if (opts?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress!(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Bunny ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    xhr.send(file);
  });

  return { url: cdnUrl, path };
}