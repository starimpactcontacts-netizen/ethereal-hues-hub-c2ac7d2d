import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, ImagePlus, Loader2, X, Users, Clock, Hash, Vote, Lock, Globe, Copy, Check, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_PLAYERS = 10;
const DURATION_OPTIONS = [15, 30, 45, 60];

function DotGrid({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
      backgroundSize: '14px 14px',
    }} />
  );
}

function SectionBox({ children, accent = 'gold' }: { children: React.ReactNode; accent?: 'gold' | 'none' }) {
  return (
    <div className="relative" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
      <DotGrid opacity={0.04} />
      {accent === 'gold' && (
        <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none" style={{
          background: 'linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.3) 60%, transparent)',
        }} />
      )}
      {/* corner notches */}
      <div className="absolute top-0 right-0 pointer-events-none">
        <div className="w-3 h-px bg-white/15" />
        <div className="w-px h-3 bg-white/15 ml-auto" />
      </div>
      <div className="absolute bottom-0 left-0 pointer-events-none">
        <div className="w-3 h-px bg-white/15" />
        <div className="w-px h-3 bg-white/15" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function CreateCompetitionPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState(() => Math.random().toString(36).slice(2, 6).toUpperCase());
  const [codeCopied, setCodeCopied] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.username && !name) {
      setName(`${profile.username}'s Room`);
    }
  }, [profile?.username]);

  const handleSubmit = async () => {
    if (!user || !profile) { navigate("/start"); return; }
    if (!name.trim()) { toast.error("Name your competition"); return; }

    setSubmitting(true);
    try {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const { data, error } = await supabase
        .from("competitions")
        .insert({
          name: name.trim(),
          theme: theme.trim() || null,
          creator_id: user.id,
          creator_username: profile.username,
          creator_avatar_url: profile.avatar_url,
          cover_image_url: coverUrl.trim() || null,
          max_players: MAX_PLAYERS,
          duration_minutes: durationMin,
          status: "lobby",
          slug,
          is_private: isPrivate,
          join_code: isPrivate ? joinCode : null,
        } as any)
        .select("id, slug")
        .single();

      if (error) throw error;

      await supabase.from("competition_participants").insert({
        competition_id: data.id,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      } as any);

      await supabase.from("competitions").update({ current_players: 1 } as any).eq("id", data.id);

      toast.success(isPrivate ? `🔒 Private lobby opened — code ${joinCode}` : "🏆 Lobby opened — waiting for editors!");
      navigate(`/competition/${data.slug || data.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => navigate("/arena")}
          className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-[18px] font-black uppercase text-white leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.08em' }}>
          Create Competition
        </span>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Stats strip */}
        <SectionBox accent="gold">
          <div className="flex items-stretch divide-x divide-white/[0.06]">
            {[
              { icon: Users,  top: '10', bot: 'LOBBY CAP' },
              { icon: Timer,  top: `${durationMin === 60 ? '1 HR' : `${durationMin} MIN`}`, bot: 'TIME LIMIT' },
              { icon: Vote,   top: 'VOTE', bot: 'WINNER PICK' },
            ].map(({ icon: Icon, top, bot }, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <Icon className="w-4 h-4 text-amber-400/70" strokeWidth={1.5} />
                <span className="text-[16px] font-black text-white leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>{top}</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">{bot}</span>
              </div>
            ))}
          </div>
        </SectionBox>

        {/* Lobby Access */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Lock className="w-3 h-3 text-white/35" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35" style={{ fontFamily: 'Teko, sans-serif' }}>Lobby Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className="py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: !isPrivate ? 'rgba(52,211,153,0.1)' : '#111',
                border: `1px solid ${!isPrivate ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: !isPrivate ? '#34d399' : 'rgba(255,255,255,0.3)' }} strokeWidth={2} />
              <span className="text-[13px] font-black uppercase tracking-wider leading-none" style={{ fontFamily: 'Teko, sans-serif', color: !isPrivate ? '#34d399' : 'rgba(255,255,255,0.35)' }}>
                Public
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className="py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: isPrivate ? 'rgba(168,85,247,0.1)' : '#111',
                border: `1px solid ${isPrivate ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <Lock className="w-3.5 h-3.5" style={{ color: isPrivate ? '#c084fc' : 'rgba(255,255,255,0.3)' }} strokeWidth={2} />
              <span className="text-[13px] font-black uppercase tracking-wider leading-none" style={{ fontFamily: 'Teko, sans-serif', color: isPrivate ? '#c084fc' : 'rgba(255,255,255,0.35)' }}>
                Private
              </span>
            </button>
          </div>

          {isPrivate && (
            <div className="mt-2 p-3 relative" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.25)' }}>
              <DotGrid opacity={0.03} />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[8px] font-black text-purple-300/70 uppercase tracking-[0.16em] mb-1">Join Code</div>
                  <div className="text-[32px] font-black text-white tabular-nums tracking-[0.3em] leading-none" style={{ fontFamily: 'Teko, sans-serif' }}>{joinCode}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setJoinCode(Math.random().toString(36).slice(2, 6).toUpperCase())}
                    className="text-[9px] font-black uppercase tracking-wider text-white/40 px-2 py-1.5 active:scale-95 transition-transform"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(joinCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500); } catch {}
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-purple-300 px-2 py-1.5 flex items-center gap-1 active:scale-95 transition-transform"
                    style={{ border: '1px solid rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.12)' }}
                  >
                    {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {codeCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="relative z-10 text-[9px] text-white/25 mt-2 leading-snug">Lobby is still visible — only editors with this code can join.</p>
            </div>
          )}
        </div>

        {/* Competition Name */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35" style={{ fontFamily: 'Teko, sans-serif' }}>Competition Name <span className="text-amber-400/60">*</span></span>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={profile?.username ? `${profile.username}'s Room` : "Your Room"}
            maxLength={60}
            className="w-full px-3 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Inter, sans-serif' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Time Limit */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3 h-3 text-white/35" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35" style={{ fontFamily: 'Teko, sans-serif' }}>Time Limit</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDurationMin(m)}
                className="py-3 flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: durationMin === m ? 'rgba(245,158,11,0.1)' : '#111',
                  border: `1px solid ${durationMin === m ? 'rgba(245,158,11,0.55)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <span
                  className="text-[13px] font-black uppercase leading-none"
                  style={{ fontFamily: 'Teko, sans-serif', color: durationMin === m ? '#f59e0b' : 'rgba(255,255,255,0.35)' }}
                >
                  {m === 60 ? '1 HR' : `${m}M`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Hash className="w-3 h-3 text-white/35" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35" style={{ fontFamily: 'Teko, sans-serif' }}>Theme / Topic</span>
            <span className="text-[9px] text-white/20 ml-1">— optional</span>
          </div>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Squid Game, Travis Scott, Anime..."
            maxLength={100}
            className="w-full px-3 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Inter, sans-serif' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Cover Image */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ImagePlus className="w-3 h-3 text-white/35" strokeWidth={2.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35" style={{ fontFamily: 'Teko, sans-serif' }}>Cover Image</span>
            <span className="text-[9px] text-white/20 ml-1">— optional</span>
          </div>
          {coverUrl ? (
            <div className="relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src={coverUrl} alt="Cover" className="w-full h-36 object-cover" />
              <button
                onClick={() => setCoverUrl("")}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full py-7 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 active:scale-[0.98]"
              style={{ background: '#0d0d0d', border: '1px dashed rgba(245,158,11,0.2)' }}
            >
              {uploadingCover
                ? <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                : <ImagePlus className="w-5 h-5 text-white/20" strokeWidth={1.5} />
              }
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/25" style={{ fontFamily: 'Teko, sans-serif' }}>
                {uploadingCover ? "Uploading..." : "Tap to upload · auto-generated if skipped"}
              </span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !user) return;
              if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
              setUploadingCover(true);
              try {
                const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
                const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                const { error: upErr } = await supabase.storage
                  .from('competition-covers')
                  .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
                if (upErr) throw upErr;
                const { data } = supabase.storage.from('competition-covers').getPublicUrl(path);
                setCoverUrl(data.publicUrl);
              } catch (err: any) {
                toast.error(err?.message || "Upload failed");
              } finally {
                setUploadingCover(false);
                if (coverInputRef.current) coverInputRef.current.value = '';
              }
            }}
          />
        </div>

        {/* Submit */}
        <div className="relative overflow-hidden active:scale-[0.98] transition-transform">
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="w-full py-4 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#f59e0b',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.3), 0 0 24px rgba(245,158,11,0.35)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }} />
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black relative z-10" />
                <span className="relative z-10 text-[20px] font-black uppercase text-black leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.06em' }}>
                  Opening...
                </span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 text-black relative z-10" strokeWidth={2.5} />
                <span className="relative z-10 text-[22px] font-black uppercase text-black leading-none" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.06em' }}>
                  Open Lobby
                </span>
              </>
            )}
          </button>
        </div>
        <p className="text-[9px] text-white/20 text-center uppercase tracking-[0.1em]" style={{ fontFamily: 'Teko, sans-serif' }}>
          Lobby waits for editors · host starts when ready
        </p>
      </div>
    </div>
  );
}
