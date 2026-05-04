import { useEffect, useState } from "react";
import { Download, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ScenepackButtons from "./ScenepackButtons";

interface Props {
  lockedId: string | null;
  lockedYoutube?: string | null;
  lockedGdrive?: string | null;
}

/**
 * Persistent in-battle scenepack download card.
 * Shows after the vote is locked so editors can re-grab the scenepack
 * even after closing the vote modal.
 */
export default function ScenepackDownloadCard({ lockedId, lockedYoutube, lockedGdrive }: Props) {
  const [pack, setPack] = useState<any>(null);

  useEffect(() => {
    if (!lockedId) { setPack(null); return; }
    supabase.from("scenepack_pool").select("*").eq("id", lockedId).maybeSingle().then(({ data }) => setPack(data));
  }, [lockedId]);

  if (!lockedId) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-400 font-bold">Your Scenepack</p>
          <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
            {pack ? `${pack.title}${pack.series ? ` · ${pack.series}` : ''}` : 'Loading…'}
          </p>
        </div>
        <Download className="w-4 h-4 text-emerald-400 shrink-0" />
      </div>
      <ScenepackButtons
        youtubeUrl={lockedYoutube || pack?.scenepack_youtube_url}
        gdriveUrl={lockedGdrive || pack?.scenepack_gdrive_url}
        legacyUrl={pack?.preview_video_url}
        variant="compact"
      />
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Download and edit in whatever software you usually use. Submit your final edit before the timer ends.
      </p>
    </div>
  );
}