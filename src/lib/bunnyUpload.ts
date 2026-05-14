import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Bunny CDN via the `bunny-upload` edge function.
 * Returns a fast, cached CDN URL like https://loop-media.b-cdn.net/<path>
 *
 * Use this for ALL video uploads and any media played at scale.
 * Tiny one-off avatars/logos can remain on Cloud storage.
 */
export async function uploadToBunny(
  file: File | Blob,
  opts?: { folder?: string; fileName?: string },
): Promise<{ url: string; path: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const inferredName =
    opts?.fileName ||
    (file instanceof File ? file.name : `upload-${Date.now()}.bin`);
  const fileType = (file as File).type || "application/octet-stream";
  const folderPrefix = opts?.folder ? `${opts.folder.replace(/^\/+|\/+$/g, "")}/` : "";
  const headerName = `${folderPrefix}${inferredName}`;

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bunny-upload`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-file-name": headerName,
      "x-file-type": fileType,
      "Content-Type": fileType,
    },
    body: file,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Upload failed (${res.status})`);
  }
  return res.json();
}