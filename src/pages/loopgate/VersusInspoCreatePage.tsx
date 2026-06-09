import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Music, Loader2, Swords, Film, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createVersusInspoBattle, submitVersusInspoEdit } from '@/hooks/useVersusInspo';
import { detectPlatform } from '@/lib/videoEmbed';
import SEO from '@/components/SEO';
import { toast } from 'sonner';

const TEKO = { fontFamily: 'Teko, sans-serif' };
const MAX_BYTES = 200 * 1024 * 1024; // 200MB

type Step = 'inspo' | 'song' | 'submit';

export default function VersusInspoCreatePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<Step>('inspo');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [inspoFile, setInspoFile] = useState<File | null>(null);
  const [inspoUrl, setInspoUrl] = useState<string | null>(null);
  const [inspoLabel, setInspoLabel] = useState('');

  const [songName, setSongName] = useState('');
  const [songArtist, setSongArtist] = useState('');

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');

  const [battleId, setBattleId] = useState<string | null>(null);
  const [mySubUrl, setMySubUrl] = useState('');

  const fileInput = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/60 text-sm">Sign in to start a Versus Inspo battle.</p>
          <button onClick={() => navigate('/auth')} className="mt-4 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider" style={TEKO}>Sign In</button>
        </div>
      </div>
    );
  }

  async function handlePickFile(f: File) {
    if (!f.type.startsWith('video/')) { toast.error('Pick a video file'); return; }
    if (f.size > MAX_BYTES) { toast.error('Max 200MB'); return; }
    setInspoFile(f);
    setUploading(true);
    try {
      const path = `versus-inspo/${user!.id}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from('loop-media').upload(path, f, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('loop-media').getPublicUrl(path);
      setInspoUrl(data.publicUrl);
      toast.success('Inspo uploaded');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
      setInspoFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!inspoUrl || !songName.trim() || !title.trim()) { toast.error('Fill everything'); return; }
    setBusy(true);
    const { data, error } = await createVersusInspoBattle({
      creator_id: user!.id,
      creator_username: profile?.username || 'editor',
      creator_avatar_url: profile?.avatar_url || null,
      inspo_video_url: inspoUrl,
      inspo_source_label: inspoLabel.trim() || null,
      song_name: songName.trim(),
      song_artist: songArtist.trim() || null,
      title: title.trim(),
      caption: caption.trim() || null,
    });
    setBusy(false);
    if (error || !data) { toast.error(error?.message || 'Failed to create'); return; }
    setBattleId(data.id);
    setStep('submit');
  }

  async function handleSubmitMyEdit() {
    if (!battleId || !mySubUrl.trim()) { toast.error('Drop your edit URL'); return; }
    const platform = detectPlatform(mySubUrl.trim());
    setBusy(true);
    const { error } = await submitVersusInspoEdit(battleId, mySubUrl.trim(), platform);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Live — 24h vote started');
    navigate(`/versus/${battleId}`);
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO title="Create Versus Inspo Battle" noindex />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => (step === 'inspo' ? navigate(-1) : setStep(step === 'submit' ? 'song' : 'inspo'))} className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.05] border border-white/[0.08]">
            <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
          </button>
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60" style={TEKO}>Versus Inspo</span>
          </div>
          <div className="w-8" />
        </div>
        <div className="max-w-xl mx-auto px-4 pb-2 flex gap-1">
          {(['inspo', 'song', 'submit'] as Step[]).map((s, i) => (
            <div key={s} className="flex-1 h-[3px] rounded-full" style={{ background: step === s || (['inspo', 'song', 'submit'].indexOf(step) > i) ? '#ef4444' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {step === 'inspo' && (
          <>
            <div>
              <h1 className="text-4xl font-bold uppercase italic tracking-tighter leading-[0.9]" style={TEKO}>
                Upload The<br />Inspo Edit
              </h1>
              <p className="text-[12px] text-white/40 mt-3 leading-relaxed">
                Drop the edit you're trying to beat. The world will see it side-by-side with yours and vote.
              </p>
            </div>

            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-white/15 hover:border-red-400/50 transition-colors flex flex-col items-center justify-center gap-3 bg-white/[0.02]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
                  <span className="text-[11px] text-white/40 uppercase tracking-wider font-black" style={TEKO}>Uploading…</span>
                </>
              ) : inspoUrl ? (
                <>
                  <Film className="w-7 h-7 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-black" style={TEKO}>Ready — Tap to Replace</span>
                  <span className="text-[10px] text-white/40 truncate max-w-[80%]">{inspoFile?.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-white/40" />
                  <span className="text-[12px] text-white/60 uppercase tracking-wider font-black" style={TEKO}>Tap to Upload</span>
                  <span className="text-[10px] text-white/30">MP4 · Max 200MB</span>
                </>
              )}
            </button>
            <input ref={fileInput} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePickFile(e.target.files[0])} />

            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black" style={TEKO}>Inspo Credit (optional)</label>
              <input
                value={inspoLabel}
                onChange={(e) => setInspoLabel(e.target.value)}
                placeholder="@original_editor or 'TikTok edit'"
                className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25"
              />
            </div>

            <button
              onClick={() => setStep('song')}
              disabled={!inspoUrl}
              className="w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.15em] text-[15px] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ ...TEKO, background: '#ef4444', color: '#fff' }}
            >
              Next — Lock The Song
            </button>
          </>
        )}

        {step === 'song' && (
          <>
            <div>
              <h1 className="text-4xl font-bold uppercase italic tracking-tighter leading-[0.9]" style={TEKO}>
                Lock The<br />Song
              </h1>
              <p className="text-[12px] text-white/40 mt-3">Same song the inspo uses. You must use this song in your edit too.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black flex items-center gap-1.5" style={TEKO}>
                  <Music className="w-3 h-3" /> Song Name *
                </label>
                <input value={songName} onChange={(e) => setSongName(e.target.value)} placeholder="e.g. Sweet Dreams" className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black" style={TEKO}>Artist (optional)</label>
                <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)} placeholder="e.g. Eurythmics" className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black" style={TEKO}>Title *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name this matchup" className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black" style={TEKO}>Caption (optional)</label>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} placeholder="What's the vibe?" className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25 resize-none" />
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 flex gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                You'll need to make your own edit with the same song, then come back to submit your version. Winner takes <b className="text-emerald-400">+30 Rings · +10 Index · +50 XP</b>.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={busy || !songName.trim() || !title.trim()}
              className="w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.15em] text-[15px] flex items-center justify-center gap-2 disabled:opacity-30"
              style={{ ...TEKO, background: '#ef4444', color: '#fff' }}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Lock In Battle
            </button>
          </>
        )}

        {step === 'submit' && (
          <>
            <div>
              <h1 className="text-4xl font-bold uppercase italic tracking-tighter leading-[0.9]" style={TEKO}>
                Drop Your<br />Version
              </h1>
              <p className="text-[12px] text-white/40 mt-3">Make your edit with the locked song, post it on TikTok/IG/YT, paste the link here. The 24h vote starts when you submit.</p>
            </div>

            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black flex items-center gap-1.5" style={TEKO}>
                <LinkIcon className="w-3 h-3" /> Your Edit URL
              </label>
              <input
                value={mySubUrl}
                onChange={(e) => setMySubUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@you/video/..."
                className="mt-1.5 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/50 leading-relaxed">
              Don't have it ready yet? No stress — you can submit later from <button onClick={() => battleId && navigate(`/versus/${battleId}`)} className="text-red-400 underline">your battle page</button>.
            </div>

            <button
              onClick={handleSubmitMyEdit}
              disabled={busy || !mySubUrl.trim()}
              className="w-full py-3.5 rounded-2xl font-black uppercase tracking-[0.15em] text-[15px] flex items-center justify-center gap-2 disabled:opacity-30"
              style={{ ...TEKO, background: '#ef4444', color: '#fff' }}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Start 24H Vote
            </button>
          </>
        )}
      </main>
    </div>
  );
}