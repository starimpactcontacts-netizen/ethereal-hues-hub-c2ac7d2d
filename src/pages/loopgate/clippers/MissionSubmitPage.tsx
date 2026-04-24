import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign, TrendingUp, Download, Play, Upload, BadgeCheck, Loader2, ExternalLink, Clock, Sparkles, Eye, CheckCircle2, XCircle, Link2, Lock, Zap, Trophy, Flame, ChevronRight, Globe, Info, X } from 'lucide-react';
import { SiYoutube, SiGoogledrive, SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
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
  approval_rate_pct: number | null;
  base_payout_requirements: string | null;
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
  const [rulesOpen, setRulesOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  const [eligibility, setEligibility] = useState<
    'idle' | 'loading' | 'none' | 'pending' | 'approved' | 'rejected'
  >('idle');
  const [eligibilityNotes, setEligibilityNotes] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [mySubmission, setMySubmission] = useState<{
    view_count: number | null;
    total_earned_cents: number | null;
    status: string | null;
  } | null>(null);

  const loadEligibility = async () => {
    if (!user || !id) return;
    setEligibility('loading');
    setEligibilityNotes(null);
    const { data } = await supabase
      .from('mission_base_eligibility' as any)
      .select('status, admin_notes')
      .eq('mission_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) {
      setEligibility('none');
    } else {
      const row = data as any;
      setEligibility((row.status as 'pending' | 'approved' | 'rejected') || 'none');
      setEligibilityNotes(row.admin_notes || null);
    }
  };

  const checkEligibility = async () => {
    if (!user) { setAuthOpen(true); return; }
    setEligibilityOpen(true);
    await loadEligibility();
  };

  const requestApproval = async () => {
    if (!user || !id) { setAuthOpen(true); return; }
    setSubmittingRequest(true);
    // Get profile for username/avatar snapshot
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    const { error } = await supabase
      .from('mission_base_eligibility' as any)
      .insert({
        mission_id: id,
        user_id: user.id,
        username: (profile as any)?.username || null,
        avatar_url: (profile as any)?.avatar_url || null,
        status: 'pending',
      } as any);
    setSubmittingRequest(false);
    if (error) {
      toast.error(error.message || 'Could not submit — try again');
      return;
    }
    toast.success('Request sent — we\'ll review shortly');
    await loadEligibility();
  };

  // Pre-load current eligibility quietly so the badge can reflect status
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from('mission_base_eligibility' as any)
        .select('status, admin_notes')
        .eq('mission_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const row = data as any;
        setEligibility((row.status as any) || 'none');
        setEligibilityNotes(row.admin_notes || null);
      } else {
        setEligibility('none');
      }
    })();
  }, [user?.id, id]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from('missions')
        .select('id, title, description, cover_image_url, base_payout_cents, view_milestones, budget_cents, spent_cents, cap_type, max_posts, approved_count, inspirations, scenepack_url, scenepack_gdrive_url, scenepack_youtube_url, eligible_platforms, status, deadline, approval_rate_pct, base_payout_requirements')
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
      const detectedPlatform = detectPlatform(videoUrl);
      // Resolve the handle to credit: prefer the user's linked account for the detected platform
      let resolvedHandle: string | null = handle.trim() || null;
      if (!resolvedHandle && detectedPlatform) {
        const { data: linked } = await supabase
          .from('clipper_linked_accounts')
          .select('handle')
          .eq('user_id', user.id)
          .eq('platform', detectedPlatform)
          .order('is_verified', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (linked?.handle) resolvedHandle = linked.handle;
      }
      const { error } = await supabase.from('mission_submissions').insert({
        mission_id: mission.id,
        user_id: user.id,
        username,
        avatar_url: avatar,
        video_url: videoUrl.trim(),
        platform: detectedPlatform,
        posted_handle: resolvedHandle,
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

  // Inspirations support two shapes:
  //   • legacy: plain string URL
  //   • new:    { video_url, link_url, username, avatar_url }
  type InspoNorm = { video_url: string | null; link_url: string | null; username: string | null; avatar_url: string | null };
  const inspoItems: InspoNorm[] = Array.isArray(mission.inspirations)
    ? mission.inspirations
        .map((x: any): InspoNorm | null => {
          if (typeof x === 'string' && x.trim()) {
            return { video_url: null, link_url: x.trim(), username: null, avatar_url: null };
          }
          if (x && typeof x === 'object') {
            const v = (x.video_url || '').trim();
            const l = (x.link_url || '').trim();
            if (!v && !l) return null;
            return {
              video_url: v || null,
              link_url: l || null,
              username: x.username || null,
              avatar_url: x.avatar_url || null,
            };
          }
          return null;
        })
        .filter(Boolean) as InspoNorm[]
    : [];
  const inspoVideos = inspoItems.filter(i => i.video_url);
  const inspoLinksOnly = inspoItems.filter(i => !i.video_url && i.link_url);

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
              <span className="text-[11px] text-[#8E8E93] font-medium tracking-[-0.01em]">
                {eligibility === 'approved' ? 'Base · approved for payout'
                  : eligibility === 'pending' ? 'Base · review in progress'
                  : eligibility === 'rejected' ? 'Base · not approved · tap to retry'
                  : 'Base · tap to check eligibility'}
              </span>
              <span
                className="text-[11px] font-medium"
                style={{
                  color:
                    eligibility === 'approved' ? '#30D158' :
                    eligibility === 'pending' ? '#FF9F0A' :
                    eligibility === 'rejected' ? '#FF453A' :
                    '#0A84FF',
                }}
              >
                {eligibility === 'approved' ? 'Approved'
                  : eligibility === 'pending' ? 'Pending'
                  : eligibility === 'rejected' ? 'Rejected'
                  : 'Check'}
              </span>
            </div>
            <p className="font-apple-tight text-[32px] font-semibold text-white leading-none mt-1 tabular-nums tracking-[-0.02em]">
              ${(mission.base_payout_cents / 100).toFixed(2)}
              <span className="text-[13px] text-[#8E8E93] font-normal ml-1.5 tracking-normal">per approved clip</span>
            </p>
            {mission.approval_rate_pct != null && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(48,209,88,0.10)' }}>
                <CheckCircle2 className="w-3 h-3 text-[#30D158]" strokeWidth={2.75} />
                <span className="text-[11px] font-semibold text-[#30D158] tabular-nums tracking-[-0.01em]">
                  {mission.approval_rate_pct}% approval rate
                </span>
                <span className="text-[10px] text-[#8E8E93] tracking-[-0.01em]">· chance of getting paid</span>
              </div>
            )}
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

        {/* Unified Brief + Resources — one cinematic card */}
        {(mission.description || scenepacks.length > 0 || inspoItems.length > 0) && (
          <section className="mt-5">
            <div
              className="relative rounded-[24px] p-[1px] overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0.12) 100%)',
              }}
            >
              <div
                className="relative rounded-[23px] overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #1c1c1e 0%, #161618 100%)' }}
              >
                {/* ambient sheens */}
                <div
                  className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }}
                />
                <div
                  className="pointer-events-none absolute -bottom-24 -right-16 w-64 h-64 rounded-full opacity-25 blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
                />

                {/* Brief */}
                {mission.description && (
                  <div className="relative px-5 pt-5 pb-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10.5px] text-[#8E8E93] font-semibold uppercase tracking-[0.14em]">The Brief</span>
                      <button
                        type="button"
                        onClick={() => setRulesOpen(true)}
                        className="flex items-center gap-1 text-[10.5px] text-[#0A84FF] font-semibold uppercase tracking-[0.14em] active:opacity-60 transition-opacity"
                        aria-label="Show rules"
                      >
                        <Info className="w-3.5 h-3.5" strokeWidth={2.4} />
                        <span>Rules</span>
                      </button>
                    </div>
                    {(() => {
                      const hasClips = scenepacks.length > 0 || inspoLinksOnly.length > 0;
                      const scrollToClips = (e: React.MouseEvent) => {
                        e.preventDefault();
                        const el = document.getElementById('ready-made-clips');
                        if (!el) return;
                        // Find nearest scrollable ancestor (the page uses a fixed shell with a scrolling <main>)
                        let scroller: HTMLElement | null = el.parentElement;
                        while (scroller && scroller !== document.body) {
                          const style = window.getComputedStyle(scroller);
                          const canScroll = /(auto|scroll|overlay)/.test(style.overflowY) && scroller.scrollHeight > scroller.clientHeight;
                          if (canScroll) break;
                          scroller = scroller.parentElement;
                        }
                        const offset = 96; // breathing room so the brief above stays visible
                        if (scroller && scroller !== document.body) {
                          const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - offset;
                          scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                        } else {
                          const top = el.getBoundingClientRect().top + window.scrollY - offset;
                          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                        }
                      };
                      const renderWithKeyword = (text: string) => {
                        if (!hasClips) return text;
                        const parts = text.split(/(ready[\s-]?made clips)/gi);
                        return parts.map((part, idx) =>
                          /^ready[\s-]?made clips$/i.test(part) ? (
                            <a
                              key={idx}
                              href="#ready-made-clips"
                              onClick={scrollToClips}
                              className="text-[#0A84FF] underline underline-offset-2 decoration-[#0A84FF]/40 hover:decoration-[#0A84FF] transition-colors"
                            >
                              {part}
                            </a>
                          ) : (
                            <span key={idx}>{part}</span>
                          )
                        );
                      };
                      const lines = mission.description
                        .split(/\n+/)
                        .map((l: string) => l.replace(/^[\-\*\u2022]\s*/, '').trim())
                        .filter((l: string) => l.length > 0);
                      if (lines.length <= 1) {
                        return (
                          <p className="font-apple-tight text-[21px] text-white leading-[1.3] whitespace-pre-wrap tracking-[-0.022em] font-medium">
                            {renderWithKeyword(mission.description)}
                          </p>
                        );
                      }
                      return (
                        <ul className="space-y-2.5">
                          {lines.map((line: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-[18px] h-[18px] text-[#30D158] shrink-0 mt-[3px]" strokeWidth={2.25} />
                              <span className="font-apple-tight text-[18px] text-white leading-[1.35] tracking-[-0.02em] font-medium">
                                {renderWithKeyword(line)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                )}

                {/* Divider when both exist */}
                {mission.description && (scenepacks.length > 0 || inspoItems.length > 0) && (
                  <div className="relative h-px mx-5" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }} />
                )}

                {/* Inspiration video tiles — autoplaying, tap → opens source */}
                {inspoVideos.length > 0 && (
                  <div className="relative px-5 pt-5 pb-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-[10.5px] text-[#8E8E93] font-semibold uppercase tracking-[0.14em]">
                        Inspirations · Tap to open
                      </span>
                    </div>
                    <div className="-mx-5 px-5 overflow-x-auto no-scrollbar">
                      <div className="flex gap-2.5 pb-1">
                        {inspoVideos.map((v, i) => {
                          const tapHref = v.link_url || v.video_url || '#';
                          return (
                            <a
                              key={`inspo-vid-${i}`}
                              href={tapHref}
                              target="_blank"
                              rel="noreferrer"
                              className="relative shrink-0 w-[124px] h-[176px] rounded-[16px] overflow-hidden bg-[#0a0a0b] border border-white/[0.06] active:scale-[0.98] transition-transform"
                            >
                              <video
                                src={v.video_url!}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                loop
                                autoPlay
                                preload="metadata"
                              />
                              {/* gradient for legibility */}
                              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-transparent to-black/30" />
                              {/* username chip */}
                              {v.username && (
                                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full overflow-hidden bg-white/10 shrink-0">
                                    {v.avatar_url && (
                                      <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <span className="text-[10.5px] font-semibold text-white truncate tracking-[-0.01em]">
                                    @{v.username}
                                  </span>
                                </div>
                              )}
                              {/* link badge */}
                              {v.link_url && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                                  <ExternalLink className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider between video tiles and resource list */}
                {inspoVideos.length > 0 && (scenepacks.length > 0 || inspoLinksOnly.length > 0) && (
                  <div className="relative h-px mx-5 mt-3" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }} />
                )}

                {/* Resources — clips + link-only inspirations unified */}
                {(scenepacks.length > 0 || inspoLinksOnly.length > 0) && (
                  <div id="ready-made-clips" className="relative px-5 pt-5 pb-4 scroll-mt-24">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10.5px] text-[#8E8E93] font-semibold uppercase tracking-[0.14em]">Get Ready-Made Clips · Tap to download</span>
                    </div>
                    <div className="-mx-1">
                      {(() => {
                        const items: { url: string; label: string; key: string }[] = [
                          ...scenepacks.map((s, i) => ({ url: s.url!, label: s.label, key: `sp-${i}` })),
                          ...inspoLinksOnly.map((it, i) => ({ url: it.link_url!, label: `Reference ${i + 1}`, key: `ins-${i}` })),
                        ];
                        const iconFor = (url: string, label: string) => {
                          const u = (url || '').toLowerCase();
                          if (u.includes('youtube.com') || u.includes('youtu.be'))
                            return { Icon: SiYoutube, color: '#FF3B30', bg: 'rgba(255,59,48,0.12)' };
                          if (u.includes('drive.google.com') || u.includes('docs.google.com'))
                            return { Icon: SiGoogledrive, color: '#FFD60A', bg: 'rgba(255,214,10,0.12)' };
                          if (u.includes('instagram.com'))
                            return { Icon: SiInstagram, color: '#FF2D55', bg: 'rgba(255,45,85,0.12)' };
                          if (u.includes('tiktok.com'))
                            return { Icon: SiTiktok, color: '#FFFFFF', bg: 'rgba(255,255,255,0.08)' };
                          return { Icon: Globe, color: '#8E8E93', bg: 'rgba(142,142,147,0.12)' };
                        };
                        return items.map((it, idx) => {
                          const { Icon, color, bg } = iconFor(it.url, it.label);
                          return (
                            <a
                              key={it.key}
                              href={it.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center gap-3 px-2 py-3 rounded-[14px] active:bg-white/[0.04] active:scale-[0.99] transition-all"
                              style={idx > 0 ? { borderTop: '0.5px solid rgba(255,255,255,0.05)' } : {}}
                            >
                              <div
                                className="w-10 h-10 rounded-[12px] shrink-0 flex items-center justify-center"
                                style={{ background: bg, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.06)' }}
                              >
                                <Icon size={20} color={color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-apple-tight text-[17px] font-semibold text-white tracking-[-0.018em] leading-tight">
                                  {it.label}
                                </p>
                                <p className="text-[12px] text-[#636366] truncate mt-0.5">{it.url}</p>
                              </div>
                              <ChevronRight className="w-[18px] h-[18px] text-[#48484A] shrink-0" strokeWidth={2.25} />
                            </a>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
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

      {rulesOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setRulesOpen(false)}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md sm:rounded-[24px] rounded-t-[24px] overflow-hidden"
            style={{ background: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0A84FF]/15 flex items-center justify-center">
                  <Info className="w-4 h-4 text-[#0A84FF]" strokeWidth={2.4} />
                </div>
                <h3 className="font-apple-tight text-[18px] font-bold text-white tracking-[-0.01em]">Mission rules</h3>
              </div>
              <button
                onClick={() => setRulesOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" strokeWidth={2.4} />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <RuleRow title="Keep your post up for 30 days">
                Don't delete, archive, or set it private. Deleted posts forfeit base + view payouts.
              </RuleRow>
              <RuleRow title="Tag the official account">
                Use the exact handle from the brief. Misspelled or missing tags = rejected.
              </RuleRow>
              <RuleRow title="Post from your linked account">
                Submit from the same handle you verified in Linked. Different account = no payout.
              </RuleRow>
              <RuleRow title="Use the ready-made clips">
                Don't reupload other clippers' edits or random unrelated footage. Original framing only.
              </RuleRow>
              <RuleRow title="One submission per post">
                Don't submit the same link twice or spam reposts. Repeated abuse = ban.
              </RuleRow>
              <RuleRow title="Public post link only">
                Send the live post URL — not a story, draft, or screenshot. Reviewed within 24h.
              </RuleRow>
              <button
                onClick={() => setRulesOpen(false)}
                className="w-full h-12 rounded-[14px] font-semibold text-[15px] text-white mt-2"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
              <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">Submit your post</h3>
              <p className="text-[13px] text-[#8E8E93] mt-1">Paste the link to your post. Reviewed within 24h.</p>
            </div>
            <div>
              <label className="text-[11px] text-[#8E8E93] font-medium px-0.5">Post link</label>
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
            {eligibility === 'loading' && (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-[#0A84FF] animate-spin" />
                <p className="text-[14px] text-[#8E8E93]">Loading…</p>
              </div>
            )}

            {(eligibility === 'none' || eligibility === 'rejected') && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#0A84FF]/15 flex items-center justify-center mb-3">
                  <BadgeCheck className="w-7 h-7 text-[#0A84FF]" strokeWidth={2.5} />
                </div>
                <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">
                  {eligibility === 'rejected' ? 'Not approved yet' : 'Base payout requirements'}
                </h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  Meet what's listed below, then tap <span className="text-white font-semibold">Check</span>. We'll review and let you know if you're approved for the ${(mission.base_payout_cents / 100).toFixed(2)} base on this mission.
                </p>

                <div className="mt-4 rounded-[14px] p-3.5" style={{ background: 'rgba(118,118,128,0.18)' }}>
                  <p className="text-[11px] uppercase tracking-wide text-[#8E8E93] font-semibold mb-1.5">What we check for</p>
                  {mission.base_payout_requirements ? (
                    <p className="text-[14px] text-white whitespace-pre-line leading-snug">
                      {mission.base_payout_requirements}
                    </p>
                  ) : (
                    <p className="text-[13px] text-[#8E8E93] leading-snug">
                      No specific requirements set — submit and we'll review your account.
                    </p>
                  )}
                </div>

                {eligibility === 'rejected' && eligibilityNotes && (
                  <div className="mt-3 rounded-[14px] p-3 border border-[#FF9F0A]/30" style={{ background: 'rgba(255,159,10,0.08)' }}>
                    <p className="text-[11px] uppercase tracking-wide text-[#FF9F0A] font-semibold mb-1">Reviewer note</p>
                    <p className="text-[13px] text-white">{eligibilityNotes}</p>
                  </div>
                )}

                <button
                  onClick={requestApproval}
                  disabled={submittingRequest}
                  className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white inline-flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
                  style={{ background: '#0A84FF' }}
                >
                  {submittingRequest
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>Check — send for review</>}
                </button>
                <button
                  onClick={() => setEligibilityOpen(false)}
                  className="w-full h-11 rounded-[14px] font-medium text-[15px] text-[#0A84FF] mt-1"
                >
                  Aim for view targets instead
                </button>
              </>
            )}

            {eligibility === 'pending' && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#FF9F0A]/15 flex items-center justify-center mb-3">
                  <Clock className="w-7 h-7 text-[#FF9F0A]" strokeWidth={2.5} />
                </div>
                <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">Under review</h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  Your request is in our queue. You'll get notified once we approve or reject you for the ${(mission.base_payout_cents / 100).toFixed(2)} base on this mission.
                </p>
                <button
                  onClick={() => setEligibilityOpen(false)}
                  className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white mt-4"
                  style={{ background: '#FF9F0A' }}
                >
                  Got it
                </button>
              </>
            )}

            {eligibility === 'approved' && (
              <>
                <div className="w-12 h-12 rounded-full bg-[#30D158]/15 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-[#30D158]" strokeWidth={2.5} />
                </div>
                <h3 className="font-apple-tight text-[22px] font-bold text-white tracking-[-0.01em]">You're approved</h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  You'll earn the ${(mission.base_payout_cents / 100).toFixed(2)} base on every approved post — plus view milestone payouts on top.
                </p>
                <button
                  onClick={() => { setEligibilityOpen(false); inputRef.current?.focus(); }}
                  className="w-full h-12 rounded-[14px] font-semibold text-[16px] text-white mt-4"
                  style={{ background: '#30D158' }}
                >
                  Start submitting
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}

function RuleRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="w-5 h-5 rounded-full bg-[#30D158]/15 flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158]" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-white tracking-[-0.01em] leading-tight">{title}</p>
        <p className="text-[12.5px] text-[#8E8E93] tracking-[-0.005em] leading-snug mt-0.5">{children}</p>
      </div>
    </div>
  );
}
