import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, ImagePlus, Loader2, X, Users, Clock, Hash, Vote, Lock, Globe, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MAX_PLAYERS = 10;
const DURATION_OPTIONS = [15, 30, 45, 60];

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

  // Pre-fill name with "{username}'s Room" once profile loads
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

      // Auto-join creator
      await supabase.from("competition_participants").insert({
        competition_id: data.id,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      } as any);

      // Bump current_players to 1
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/arena")} className="p-1.5 hover:bg-surface-1 rounded-full transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <Trophy className="w-4 h-4 text-gold" />
        <h1 className="text-sm font-bold text-foreground">Create Competition</h1>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Format summary card */}
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <Users className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-bold text-foreground">10 Editors</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Lobby Cap</span>
          </div>
          <div className="w-px h-10 bg-border/40" />
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-bold text-foreground">{durationMin} Mins</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Time Limit</span>
          </div>
          <div className="w-px h-10 bg-border/40" />
          <div className="flex flex-col items-center gap-1">
            <Vote className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-bold text-foreground">Voting</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Winner Pick</span>
          </div>
        </div>

        {/* Privacy — top of form: most important decision */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Lobby Access
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsPrivate(false)}
              className={`py-2.5 rounded-lg border text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                !isPrivate ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" : "bg-surface-1 border-border/40 text-muted-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Public
            </button>
            <button
              type="button"
              onClick={() => setIsPrivate(true)}
              className={`py-2.5 rounded-lg border text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                isPrivate ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-300" : "bg-surface-1 border-border/40 text-muted-foreground"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Private
            </button>
          </div>
          {isPrivate && (
            <div className="mt-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-fuchsia-300/80 uppercase tracking-wider mb-0.5">Join Code</div>
                  <div className="text-2xl font-black text-foreground tabular-nums tracking-[0.3em]" style={{ fontFamily: "Teko, sans-serif" }}>{joinCode}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setJoinCode(Math.random().toString(36).slice(2, 6).toUpperCase())}
                    className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border/40 rounded-md px-2 py-1.5"
                  >
                    New
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(joinCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500); } catch {}
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-300 border border-fuchsia-500/40 bg-fuchsia-500/10 rounded-md px-2 py-1.5 flex items-center gap-1"
                  >
                    {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {codeCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">Lobby still shows in the carousel with a 🔒 — but only editors with the code can join & ready up.</p>
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Competition Name *
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={profile?.username ? `${profile.username}'s Room` : "Your Room"}
            maxLength={60}
            className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Duration selector */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Time Limit
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDurationMin(m)}
                className={`py-2.5 rounded-lg border text-sm font-bold transition-all ${
                  durationMin === m
                    ? "bg-gold/15 border-gold/50 text-gold"
                    : "bg-surface-1 border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {m === 60 ? "1 hr" : `${m} min`}
              </button>
            ))}
          </div>
        </div>

        {/* Theme (optional) */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3 h-3" /> Theme / Topic
          </label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Squid Game, Travis Scott, Anime..."
            maxLength={100}
            className="w-full bg-surface-1 border border-border/40 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <span className="text-[9px] text-muted-foreground/50 mt-1 block">Optional — leave blank for open theme</span>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <ImagePlus className="w-3 h-3" /> Cover Image <span className="text-muted-foreground/40 normal-case tracking-normal">— optional</span>
          </label>
          {coverUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border/40">
              <img src={coverUrl} alt="Cover" className="w-full h-32 object-cover" />
              <button
                onClick={() => setCoverUrl("")}
                className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full bg-surface-1 border border-border/40 border-dashed rounded-lg px-3 py-5 flex flex-col items-center gap-1.5 hover:border-gold/30 transition-colors disabled:opacity-50"
            >
              {uploadingCover ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5 text-muted-foreground/60" />
              )}
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                {uploadingCover ? "Uploading..." : "Tap to upload — we'll auto-generate one if you skip"}
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
                const ext = file.name.split('.').pop() || 'jpg';
                const path = `competitions/${user.id}/${Date.now()}.${ext}`;
                const { error } = await supabase.storage.from('loop-media').upload(path, file, { cacheControl: '3600', upsert: false });
                if (error) throw error;
                const { data: urlData } = supabase.storage.from('loop-media').getPublicUrl(path);
                setCoverUrl(urlData.publicUrl);
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
        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim()}
          className="w-full bg-gold text-black font-bold uppercase tracking-wider text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Opening Lobby...</>
          ) : (
            <><Trophy className="w-4 h-4" /> Open Lobby</>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Lobby waits for editors. Host can start when ready, or wait until 10 join.
        </p>
      </div>
    </div>
  );
}
