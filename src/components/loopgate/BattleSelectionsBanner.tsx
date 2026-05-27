import { useEffect, useState } from 'react';
import { Download, Film, Loader2, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Pick {
  pack?: { id?: string | null; name?: string | null; poster?: string | null } | null;
  song?: { id?: string | null; title?: string | null; artist?: string | null; cover?: string | null; preview?: string | null } | null;
}

interface Props {
  fightId: string;
  mySide: 'red' | 'blue';
  redUsername: string;
  blueUsername: string;
}

export default function BattleSelectionsBanner({ fightId, mySide, redUsername, blueUsername }: Props) {
  const [mine, setMine] = useState<Pick | null>(null);
  const [opp, setOpp] = useState<Pick | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc('get_quick_fight_selection_state' as any, { p_fight_id: fightId } as any);
      if (cancelled || !data) return;
      const d = data as any;
      setMine(d.mine || null);
      setOpp(d.opponent || null);
    };
    load();
    const ch = supabase
      .channel(`qf_sel_banner_${fightId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_fight_selections', filter: `fight_id=eq.${fightId}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [fightId]);

  const red = mySide === 'red' ? mine : opp;
  const blue = mySide === 'blue' ? mine : opp;

  if (!red?.pack?.name && !red?.song?.title && !blue?.pack?.name && !blue?.song?.title) return null;

  return (
    <div className="grid grid-cols-2 gap-0 border border-white/10 bg-black/70 overflow-hidden">
      <SideBlock
        color="red"
        label={mySide === 'red' ? 'RED · YOU' : 'RED'}
        username={redUsername}
        pick={red}
      />
      <SideBlock
        color="blue"
        label={mySide === 'blue' ? 'BLUE · YOU' : 'BLUE'}
        username={blueUsername}
        pick={blue}
      />
    </div>
  );
}

function SideBlock({ color, label, username, pick }: { color: 'red' | 'blue'; label: string; username: string; pick: Pick | null }) {
  const isRed = color === 'red';
  const accent = isRed ? 'text-red-400' : 'text-blue-400';
  const border = isRed ? 'border-r border-red-500/20' : 'border-l border-blue-500/20';
  const gradFrom = isRed ? 'from-red-500/[0.07]' : 'from-blue-500/[0.07]';
  const accentHex = isRed ? '#ef4444' : '#3b82f6';

  const hasAnyPick = !!(pick?.pack?.name || pick?.song?.title);

  return (
    <div className={`p-2.5 ${border} bg-gradient-to-b ${gradFrom} to-transparent space-y-2`}>
      <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${accent}`} style={{ fontFamily: 'Teko, sans-serif' }}>
        {label} <span className="text-white/40">· @{username}</span>
      </p>

      {!hasAnyPick ? (
        <div className="py-3 space-y-1">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider leading-tight" style={{ fontFamily: 'Teko, sans-serif' }}>
            No selections yet
          </p>
          <p className="text-[9px] text-white/20 leading-snug">
            No scenepacks available — go find your own scenepacks for this type shi
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pick?.pack?.name ? (
            <PickRow
              icon={<Film className="w-3 h-3 text-white/40" />}
              label="Scenepack"
              coverUrl={pick.pack.poster || null}
              title={pick.pack.name}
              subtitle={null}
              accentHex={accentHex}
              /* No pack file download URL available — button stays disabled */
              onDownload={null}
            />
          ) : (
            <EmptyPickRow label="Scenepack" />
          )}

          {pick?.song?.title ? (
            <PickRow
              icon={<Music className="w-3 h-3 text-white/40" />}
              label="Song"
              coverUrl={pick.song.cover || null}
              title={pick.song.title}
              subtitle={pick.song.artist || null}
              accentHex={accentHex}
              onDownload={pick.song.preview
                ? () => downloadAudio(pick.song!.preview!, pick.song!.title!, pick.song!.artist)
                : null}
            />
          ) : (
            <EmptyPickRow label="Song" />
          )}
        </div>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

/**
 * Fetch the source, attempt WAV extraction via AudioContext (strips video
 * container). If decodeAudioData fails (e.g. the codec isn't supported by
 * the browser), fall back to downloading the raw bytes with a clean filename
 * so the download always succeeds regardless of original format.
 */
async function downloadAudio(previewUrl: string, title: string, artist?: string | null) {
  const safeName = [title, artist].filter(Boolean).join(' - ').replace(/[^\w\s\-()']/g, '').trim() || 'preview';

  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error('fetch failed');
    // Keep a copy of the buffer — decodeAudioData detaches the original
    const arrayBuffer = await res.arrayBuffer();
    const bufferCopy = arrayBuffer.slice(0);

    try {
      // Primary path: decode audio track → encode as WAV (pure audio, no video)
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);
      audioCtx.close();
      triggerDownload(new Blob([encodeWAV(audioBuffer)], { type: 'audio/wav' }), `${safeName}.wav`);
    } catch {
      // Fallback: decodeAudioData failed (e.g. video-container MP4 on iOS).
      // Re-wrap as audio/mp4 (.m4a) — same bytes, but iOS opens it in the
      // audio player rather than the video player, hiding the video track.
      triggerDownload(
        new Blob([arrayBuffer], { type: 'audio/mp4' }),
        `${safeName}.m4a`,
      );
    }
  } catch {
    toast.error('Could not download audio — try again');
  }
}

function encodeWAV(buf: AudioBuffer): ArrayBuffer {
  const numCh = buf.numberOfChannels;
  const sr = buf.sampleRate;
  const numSamples = buf.length;
  const bps = 16;
  const dataSize = numSamples * numCh * (bps / 8);
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  const ws = (off: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };

  ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true);
  ws(8, 'WAVE'); ws(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);          // PCM
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * (bps / 8), true);
  v.setUint16(32, numCh * (bps / 8), true);
  v.setUint16(34, bps, true);
  ws(36, 'data'); v.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(ch)[i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return ab;
}

function PickRow({
  icon,
  label,
  coverUrl,
  title,
  subtitle,
  accentHex,
  onDownload,
}: {
  icon: React.ReactNode;
  label: string;
  coverUrl: string | null;
  title: string;
  subtitle: string | null;
  accentHex: string;
  onDownload: (() => Promise<void> | void) | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!onDownload || downloading) return;
    setDownloading(true);
    await onDownload();
    setDownloading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-11 h-11 shrink-0 overflow-hidden rounded-sm bg-white/5 border border-white/10 flex items-center justify-center">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">{icon}</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {icon}
          <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">{label}</span>
        </div>
        <p className="text-[12px] font-bold text-white truncate leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-white/45 truncate leading-tight">{subtitle}</p>
        )}
      </div>

      {onDownload ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-colors active:scale-90 disabled:opacity-50"
          aria-label={`Download ${label}`}
          style={{ color: accentHex }}
        >
          {downloading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Download className="w-3 h-3" />}
        </button>
      ) : (
        <div
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm border border-white/8 bg-white/[0.03] opacity-25 cursor-not-allowed"
          title="No download available"
        >
          <Download className="w-3 h-3 text-white/40" />
        </div>
      )}
    </div>
  );
}

function EmptyPickRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-11 h-11 shrink-0 rounded-sm border border-dashed border-white/10 flex items-center justify-center">
        {label === 'Scenepack' ? (
          <Film className="w-3.5 h-3.5 text-white/15" />
        ) : (
          <Music className="w-3.5 h-3.5 text-white/15" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] uppercase tracking-wider text-white/25 font-bold mb-0.5">{label}</p>
        <p className="text-[10px] text-white/20 leading-tight">
          No {label.toLowerCase()} available — find your own
        </p>
      </div>
    </div>
  );
}
