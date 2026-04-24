import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign, TrendingUp, Download, Play, Upload, BadgeCheck, Loader2, ExternalLink, Clock, Sparkles, Eye, CheckCircle2, XCircle, Link2, Lock, Zap, Trophy, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AccountPromptModal from '@/components/loopgate/AccountPromptModal';
import ViewsGamePanel from '@/components/loopgate/ViewsGamePanel';
import PlatformBadges from '@/components/loopgate/missions/PlatformBadges';

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
  eligible_platforms: string[] | null;
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
  const [submitOpen, setSubmitOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [eligibility, setEligibility] = useState<'idle' | 'checking' | 'eligible' | 'ineligible'>('idle');
  const [linkedCount, setLinkedCount] = useState(0);
  const [mySubmission, setMySubmission] = useState<{
    view_count: number | null;
    total_earned_cents: number | null;
    status: string | null;
  } | null>(null);

  const checkEligibility = async () => {
    if (!user) { setAuthOpen(true); return; }
    setEligibilityOpen(true);
    setEligibility('checking');
    const { count } = await supabase
      .from('clipper_linked_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    const c = count || 0;
    setLinkedCount(c);
    setEligibility(c > 0 ? 'eligible' : 'ineligible');
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('missions')
        .select('id, title, description, cover_image_url, base_payout_cents, view_milestones, budget_cents, spent_cents, cap_type, max_posts, approved_count, inspirations, scenepack_url, scenepack_gdrive_url, scenepack_youtube_url, eligible_platforms, status, deadline')
        .eq('id', id)
        .maybeSingle();
      setMission((data as any) || null);
      setLoading(false);
    })();
  }, [id]);

  // Pull this user's actual submission for this mission so the earnings panel reflects reality
  useEffect(() => {
    if (!id || !user) { setMySubmission(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('mission_submissions')
        .select('view_count, total_earned_cents, status')
        .eq('mission_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setMySubmission((data as any) || null);
    })();
    return () => { cancelled = true; };
  }, [id, user?.id]);

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
      setSubmitOpen(false);
      navigate('/missions/submissions');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmit = () => {
    if (!user) { setAuthOpen(true); return; }
    setSubmitOpen(true);
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

      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-12">
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
            <div className="mt-2">
              <PlatformBadges platforms={mission.eligible_platforms} size="sm" showLabel />
            </div>
          </div>
        </motion.div>

        {/* Payout strip */}
        <section className="mt-4 rounded-[18px] p-4" style={{ background: '#1c1c1e' }}>
          <button
            onClick={checkEligibility}
            className="w-full text-left active:opacity-70 transition-opacity"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8E8E93] font-medium tracking-[-0.01em]">Base · tap to check eligibility</span>
              <span className="text-[11px] text-[#0A84FF] font-medium">Check</span>
            </div>
            <p className="font-apple-tight text-[32px] font-semibold text-white leading-none mt-1 tabular-nums tracking-[-0.02em]">
              ${(mission.base_payout_cents / 100).toFixed(2)}
              <span className="text-[13px] text-[#8E8E93] font-normal ml-1.5 tracking-normal">per approved clip</span>
            </p>
          </button>

          {milestones.length > 0 && (
            <ViewsGamePanel
              milestones={milestones}
              hasSubmission={!!mySubmission}
              currentViews={mySubmission?.view_count ?? 0}
              earnedCents={mySubmission?.total_earned_cents ?? 0}
              submissionStatus={mySubmission?.status ?? null}
            />
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

        {/* Description — cinematic brief card */}
        {mission.description && (
          <section className="mt-5">
            <div className="flex items-center gap-1.5 px-1 mb-2">
              <Sparkles className="w-3 h-3 text-[#0A84FF]" />
              <h2 className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-[0.12em]">The Brief</h2>
            </div>
            <div
              className="relative rounded-[20px] p-[1px] overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(10,132,255,0.35) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.02) 100%)',
              }}
            >
              <div
                className="relative rounded-[19px] p-4 overflow-hidden"
                style={{
                  background:
                    'linear-gradient(180deg, #1a1a1c 0%, #131315 100%)',
                }}
              >
                {/* subtle sheen */}
                <div
                  className="pointer-events-none absolute -top-16 -left-12 w-48 h-48 rounded-full opacity-40 blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.35) 0%, transparent 70%)' }}
                />
                <p className="relative text-[15px] text-white/95 leading-[1.5] whitespace-pre-wrap tracking-[-0.005em]">
                  {mission.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Scenepacks — minimal, trust-badge style */}
        {scenepacks.length > 0 && (
          <section className="mt-5">
            <div className="flex items-center gap-1.5 px-1 mb-2">
              <h2 className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-[0.12em]">Ready-Made Clips</h2>
              <div className="flex items-center gap-1 px-1.5 py-[1px] rounded-full" style={{ background: 'rgba(48,209,88,0.12)' }}>
                <BadgeCheck className="w-2.5 h-2.5 text-[#30D158]" strokeWidth={2.5} />
                <span className="text-[9px] font-semibold text-[#30D158] uppercase tracking-wide">Verified</span>
              </div>
            </div>
            <div className="rounded-[18px] overflow-hidden border border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.015)' }}>
              {scenepacks.map((s, i) => (
                <a
                  key={i}
                  href={s.url!}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex items-center gap-3 px-3.5 py-3 active:bg-white/[0.03] transition-colors ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Download className="w-3.5 h-3.5 text-[#8E8E93] group-active:text-[#0A84FF] transition-colors" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-medium text-white/90">{s.label}</p>
                      <BadgeCheck className="w-3 h-3 text-[#0A84FF]" strokeWidth={2.5} />
                    </div>
                    <p className="text-[11px] text-[#636366] truncate mt-0.5">{s.url}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#3A3A3C]" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Inspirations — minimal style matching scenepacks */}
        {inspos.length > 0 && (
          <section className="mt-5">
            <div className="flex items-center gap-1.5 px-1 mb-2">
              <h2 className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-[0.12em]">Inspirations</h2>
              <div className="flex items-center gap-1 px-1.5 py-[1px] rounded-full" style={{ background: 'rgba(48,209,88,0.12)' }}>
                <BadgeCheck className="w-2.5 h-2.5 text-[#30D158]" strokeWidth={2.5} />
                <span className="text-[9px] font-semibold text-[#30D158] uppercase tracking-wide">Verified</span>
              </div>
            </div>
            <div className="rounded-[18px] overflow-hidden border border-white/[0.05]" style={{ background: 'rgba(255,255,255,0.015)' }}>
              {inspos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex items-center gap-3 px-3.5 py-3 active:bg-white/[0.03] transition-colors ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <Play className="w-3 h-3 text-[#8E8E93] group-active:text-[#FF453A] transition-colors fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-medium text-white/90">Reference {i + 1}</p>
                      <BadgeCheck className="w-3 h-3 text-[#0A84FF]" strokeWidth={2.5} />
                    </div>
                    <p className="text-[11px] text-[#636366] truncate mt-0.5">{url}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#3A3A3C]" />
                </a>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Floating pump.fun-style submit CTA — replaces bottom nav on mission view */}
      <div
        className="fixed left-0 right-0 z-40 pointer-events-none"
        style={{ bottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="max-w-md mx-auto px-4 pointer-events-auto">
          <button
            onClick={openSubmit}
            disabled={submitting}
            className="relative w-full h-[58px] rounded-[18px] font-semibold text-[17px] text-black inline-flex items-center justify-center gap-2 transition-all active:scale-[0.985] disabled:cursor-not-allowed overflow-hidden tracking-[-0.01em]"
            style={{
              background: 'linear-gradient(180deg, #6EF2A0 0%, #3BE36A 45%, #1FB84A 100%)',
              color: '#0B3B1E',
              boxShadow:
                '0 12px 32px -8px rgba(48,209,88,0.6), 0 2px 0 rgba(255,255,255,0.35) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 0 0 0.5px rgba(255,255,255,0.2) inset',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              border: '0.5px solid rgba(255,255,255,0.3)',
            }}
          >
            {/* iOS glass highlight */}
            <span
              aria-hidden
              className="absolute inset-x-3 top-1 h-[20px] rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))' }}
            />
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin relative" />
            ) : (
              <span className="relative inline-flex items-center gap-2">
                <Upload className="w-[19px] h-[19px]" strokeWidth={2.75} />
                Submit
              </span>
            )}
          </button>
        </div>
      </div>

      <AccountPromptModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        reason="Sign up to submit your clip and get paid."
      />

      {submitOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => !submitting && setSubmitOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] p-5 pb-8 sm:pb-5 space-y-4"
            style={{ background: '#1c1c1e' }}
          >
            <div>
              <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">Submit your clip</h3>
              <p className="text-[13px] text-[#8E8E93] mt-1">Paste the link to your posted clip. Reviewed within 24h.</p>
            </div>
            <div>
              <label className="text-[11px] text-[#8E8E93] font-medium px-0.5">Clip link</label>
              <input
                ref={inputRef}
                autoFocus
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://tiktok.com/..."
                className="w-full h-11 px-3 mt-1 rounded-[12px] text-[15px] text-white placeholder:text-[#48484A] outline-none"
                style={{ background: 'rgba(118, 118, 128, 0.24)' }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !videoUrl.trim()}
              className="w-full h-12 rounded-[14px] font-semibold text-[16px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#30D158', color: '#0B3B1E' }}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-[18px] h-[18px]" strokeWidth={2.75} />Submit</>}
            </button>
            <button
              onClick={() => setSubmitOpen(false)}
              disabled={submitting}
              className="w-full h-11 rounded-[14px] font-medium text-[15px] text-[#0A84FF]"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {eligibilityOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setEligibilityOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] p-5 pb-8 sm:pb-5"
            style={{ background: '#1c1c1e' }}
          >
            {eligibility === 'checking' && (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-[#0A84FF] animate-spin" />
                <p className="text-[14px] text-[#8E8E93]">Checking your accounts…</p>
              </div>
            )}
            {eligibility === 'eligible' && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#30D158]/15 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-[#30D158]" strokeWidth={2.5} />
                </div>
                <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">You're eligible</h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  {linkedCount} linked {linkedCount === 1 ? 'account' : 'accounts'}. You'll earn the ${(mission.base_payout_cents / 100).toFixed(2)} base on every approved clip — plus view milestone bonuses on top.
                </p>
                <button
                  onClick={() => { setEligibilityOpen(false); inputRef.current?.focus(); }}
                  className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white inline-flex items-center justify-center gap-2 mt-4"
                  style={{ background: '#30D158' }}
                >
                  Start submitting
                </button>
              </>
            )}
            {eligibility === 'ineligible' && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#FF9F0A]/15 flex items-center justify-center mb-3">
                  <XCircle className="w-7 h-7 text-[#FF9F0A]" strokeWidth={2.5} />
                </div>
                <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">Not eligible for base payout</h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  Link a TikTok, Instagram, or YouTube account to unlock the ${(mission.base_payout_cents / 100).toFixed(2)} base. You can still submit and <span className="text-white font-semibold">aim for the view targets</span> to earn milestone bonuses.
                </p>
                <Link
                  to="/clippers/accounts"
                  className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white inline-flex items-center justify-center gap-2 mt-4"
                  style={{ background: '#0A84FF' }}
                >
                  <Link2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  Link account
                </Link>
                <button
                  onClick={() => setEligibilityOpen(false)}
                  className="w-full h-11 rounded-[14px] font-medium text-[15px] text-[#0A84FF] mt-2"
                >
                  Aim for view targets instead
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
