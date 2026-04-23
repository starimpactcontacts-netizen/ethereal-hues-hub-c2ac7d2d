import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign, TrendingUp, Download, Play, Upload, BadgeCheck, Loader2, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';

interface Milestone { views: number; bonus_cents: number; }

interface Mission {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  base_payout_cents: number;
  view_milestones: Milestone[];
  budget_cents: number | null;
  spent_cents: number | null;
  cap_type: string | null;
  max_posts: number | null;
  approved_count: number | null;
  inspirations: any;
  scenepack_url: string | null;
  scenepack_gdrive_url: string | null;
  scenepack_youtube_url: string | null;
  status: string;
  deadline: string | null;
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('instagram')) return 'instagram';
  if (u.includes('youtube') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('twitter') || u.includes('x.com')) return 'twitter';
  return 'other';
}

const formatMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MissionSubmitPage() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState('');
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('missions')
        .select('id, title, description, cover_image_url, base_payout_cents, view_milestones, budget_cents, spent_cents, cap_type, max_posts, approved_count, inspirations, scenepack_url, scenepack_gdrive_url, scenepack_youtube_url, status, deadline')
        .eq('id', id)
        .maybeSingle();
      setMission((data as any) || null);
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async () => {
    if (!user) { setAuthOpen(true); return; }
    if (!mission || !videoUrl.trim()) {
      toast.error('Paste your clip link first');
      return;
    }
    setSubmitting(true);
    try {
      const username = (user.user_metadata?.username as string) || user.email?.split('@')[0] || 'user';
      const avatar = (user.user_metadata?.avatar_url as string) || null;
      const { error } = await supabase.from('mission_submissions').insert({
        mission_id: mission.id,
        user_id: user.id,
        username,
        avatar_url: avatar,
        video_url: videoUrl.trim(),
        platform: detectPlatform(videoUrl),
        posted_handle: handle.trim() || null,
        status: 'pending',
      } as any);
      if (error) throw error;
      toast.success('Submitted! We review within 24h.');
      navigate('/missions/submissions');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="h-56 rounded-[20px] bg-[#1c1c1e] animate-pulse" />
        <div className="h-32 rounded-[20px] bg-[#1c1c1e] animate-pulse mt-3" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-8 text-center">
        <Sparkles className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
        <p className="text-[17px] font-semibold text-white">Mission not found</p>
        <Link to="/missions" className="text-[13px] text-[#0A84FF] mt-2 inline-block">Back to missions</Link>
      </div>
    );
  }

  const milestones = (mission.view_milestones || []).slice(0, 3);
  const isPostsCap = mission.cap_type === 'posts';
  const budget = mission.budget_cents || 0;
  const spent = mission.spent_cents || 0;
  const maxPosts = mission.max_posts || 0;
  const approved = mission.approved_count || 0;
  const pct = isPostsCap
    ? (maxPosts > 0 ? Math.min(100, (approved / maxPosts) * 100) : 0)
    : (budget > 0 ? Math.min(100, (spent / budget) * 100) : 0);
  const showProgress = isPostsCap ? maxPosts > 0 : budget > 0;

  const inspos: string[] = Array.isArray(mission.inspirations)
    ? mission.inspirations.filter((x: any) => typeof x === 'string' && x.trim())
    : [];

  const scenepacks = [
    { url: mission.scenepack_url, label: 'Scenepack' },
    { url: mission.scenepack_gdrive_url, label: 'Google Drive' },
    { url: mission.scenepack_youtube_url, label: 'YouTube' },
  ].filter(s => s.url);

  return (
    <>
      {/* iOS-style nav */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-2 h-11 flex items-center">
          <button
            onClick={() => navigate('/missions')}
            className="flex items-center gap-0.5 text-[#0A84FF] active:opacity-60 transition-opacity px-2 h-11"
          >
            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.5} />
            <span className="text-[17px] font-normal">Missions</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Hero cover */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[20px] overflow-hidden mt-3 aspect-[16/9] bg-[#1c1c1e]"
        >
          {mission.cover_image_url ? (
            <img src={mission.cover_image_url} alt={mission.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-[#48484A]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30">
            <BadgeCheck className="w-3 h-3 text-emerald-300" strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">Loopgate Official</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h1 className="font-apple-tight text-[24px] font-bold text-white leading-tight tracking-[-0.02em]">{mission.title}</h1>
          </div>
        </motion.div>

        {/* Payout strip */}
        <section className="mt-4 rounded-[18px] p-4" style={{ background: '#1c1c1e' }}>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wide">Base payout</span>
          </div>
          <p className="font-apple-tight text-[34px] font-bold text-[#30D158] leading-none mt-1 tabular-nums">
            ${(mission.base_payout_cents / 100).toFixed(2)}
            <span className="text-[14px] text-[#8E8E93] font-medium ml-1">/ approved clip</span>
          </p>

          {milestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wide mb-2">View bonuses</p>
              <div className="space-y-1.5">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-white/80 inline-flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-[#8E8E93]" />
                      {m.views.toLocaleString()}+ views
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: '#30D158' }}>+{formatMoney(m.bonus_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showProgress && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="h-[3px] rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#30D158' }} />
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-1.5 tabular-nums">
                {isPostsCap ? `${approved} / ${maxPosts} posts filled` : `${formatMoney(spent)} / ${formatMoney(budget)} pool`}
              </p>
            </div>
          )}

          {mission.deadline && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[12px] text-[#8E8E93]">
              <Clock className="w-3 h-3" />
              <span>Ends {new Date(mission.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </section>

        {/* Description */}
        {mission.description && (
          <section className="mt-4">
            <h2 className="text-[13px] text-[#8E8E93] font-medium uppercase tracking-wide px-1 mb-2">The brief</h2>
            <div className="rounded-[18px] p-4" style={{ background: '#1c1c1e' }}>
              <p className="text-[15px] text-white/90 leading-[1.45] whitespace-pre-wrap">{mission.description}</p>
            </div>
          </section>
        )}

        {/* Scenepacks */}
        {scenepacks.length > 0 && (
          <section className="mt-4">
            <h2 className="text-[13px] text-[#8E8E93] font-medium uppercase tracking-wide px-1 mb-2">Ready-made clips</h2>
            <div className="rounded-[18px] overflow-hidden" style={{ background: '#1c1c1e' }}>
              {scenepacks.map((s, i) => (
                <a
                  key={i}
                  href={s.url!}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 p-3.5 active:bg-white/[0.04] transition-colors ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(10,132,255,0.15)' }}>
                    <Download className="w-4 h-4 text-[#0A84FF]" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white">{s.label}</p>
                    <p className="text-[12px] text-[#8E8E93] truncate">{s.url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#48484A]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Inspirations */}
        {inspos.length > 0 && (
          <section className="mt-4">
            <h2 className="text-[13px] text-[#8E8E93] font-medium uppercase tracking-wide px-1 mb-2">Inspirations</h2>
            <div className="rounded-[18px] overflow-hidden" style={{ background: '#1c1c1e' }}>
              {inspos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 p-3.5 active:bg-white/[0.04] transition-colors ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,69,58,0.15)' }}>
                    <Play className="w-4 h-4 text-[#FF453A] fill-[#FF453A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white">Reference {i + 1}</p>
                    <p className="text-[12px] text-[#8E8E93] truncate">{url}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#48484A]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Submit */}
        <section className="mt-5">
          <h2 className="text-[13px] text-[#8E8E93] font-medium uppercase tracking-wide px-1 mb-2">Submit your clip</h2>
          <div className="rounded-[18px] p-4 space-y-3" style={{ background: '#1c1c1e' }}>
            <div>
              <label className="text-[11px] text-[#8E8E93] font-medium px-0.5">Clip link</label>
              <input
                ref={inputRef}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://tiktok.com/..."
                className="w-full h-11 px-3 mt-1 rounded-[12px] text-[15px] text-white placeholder:text-[#48484A] outline-none"
                style={{ background: 'rgba(118, 118, 128, 0.24)' }}
              />
            </div>
            <div>
              <label className="text-[11px] text-[#8E8E93] font-medium px-0.5">Account handle <span className="text-[#48484A]">(optional)</span></label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="w-full h-11 px-3 mt-1 rounded-[12px] text-[15px] text-white placeholder:text-[#48484A] outline-none"
                style={{ background: 'rgba(118, 118, 128, 0.24)' }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !videoUrl.trim()}
              className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white inline-flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-40"
              style={{ background: videoUrl.trim() ? '#30D158' : '#2c2c2e' }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  Submit clip
                </>
              )}
            </button>
            <p className="text-[11px] text-[#8E8E93] text-center">Reviewed within 24h · Paid on approval</p>
          </div>
        </section>
      </div>

      <AccountPromptModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Sign up to submit your clip and get paid."
      />
    </>
  );
}
