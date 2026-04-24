import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Plus, ExternalLink, Clock, Check, X as XIcon, Loader2, DollarSign, TrendingUp, ChevronRight, BadgeCheck, Search, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import PlatformBadges from '@/components/loopgate/missions/PlatformBadges';

interface Submission {
  id: string;
  campaign_name: string | null;
  title: string | null;
  video_url: string;
  thumbnail_url: string | null;
  platform: string | null;
  view_count: number;
  status: string;
  earned_cents: number;
  created_at: string;
}

interface Milestone { views: number; bonus_cents: number; }
interface PickableMission {
  id: string;
  title: string;
  cover_image_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  base_payout_cents: number;
  view_milestones: Milestone[];
  eligible_platforms: string[] | null;
  status: string;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ClippersSubmissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [missions, setMissions] = useState<PickableMission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [pickSearch, setPickSearch] = useState('');

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('clip_submissions')
      .select('id, campaign_name, title, video_url, thumbnail_url, platform, view_count, status, earned_cents, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubs((data || []) as Submission[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openPicker = async () => {
    if (!user) { setShowGate(true); return; }
    setShowPicker(true);
    if (missions.length === 0) {
      setMissionsLoading(true);
      const { data } = await supabase
        .from('missions')
        .select('id, title, cover_image_url, sponsor_name, sponsor_logo_url, base_payout_cents, view_milestones, eligible_platforms, status')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(40);
      setMissions(((data as any) || []) as PickableMission[]);
      setMissionsLoading(false);
    }
  };

  const pickMission = (m: PickableMission) => {
    setShowPicker(false);
    navigate(`/missions/submit?id=${m.id}`);
  };

  const counts = {
    all: subs.length,
    pending: subs.filter((s) => s.status === 'pending').length,
    approved: subs.filter((s) => s.status === 'approved' || s.status === 'paid').length,
    rejected: subs.filter((s) => s.status === 'rejected').length,
  };
  const filtered =
    tab === 'all' ? subs :
    tab === 'approved' ? subs.filter((s) => s.status === 'approved' || s.status === 'paid') :
    subs.filter((s) => s.status === tab);
  const totalEarned = subs.reduce((s, x) => s + (x.earned_cents || 0), 0);

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4 flex items-end justify-between">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Clips</h1>
        <button
          onClick={openPicker}
          className="flex items-center gap-1 h-8 px-3 rounded-full bg-[#D4A857] text-white text-[14px] font-semibold active:opacity-60 transition-opacity"
        >
          <Plus className="w-[15px] h-[15px]" strokeWidth={2.8} /> New
        </button>
      </section>

      {/* Stats trio */}
      <section className="max-w-6xl mx-auto px-4 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Submitted" value={counts.all.toString()} />
          <StatCard label="Approved" value={counts.approved.toString()} accent="#30D158" />
          <StatCard label="Earned" value={`$${(totalEarned / 100).toFixed(0)}`} accent="#FFCC00" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {/* iOS segmented control */}
        <div
          className="flex p-[3px] rounded-[10px]"
          style={{ background: 'rgba(118, 118, 128, 0.24)' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 h-8 text-[13px] font-semibold rounded-[8px] transition-all ${
                tab === t.id ? 'text-white' : 'text-[#EBEBF5]/60'
              }`}
              style={tab === t.id ? { background: '#636366', boxShadow: '0 3px 8px rgba(0,0,0,0.3)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[16px] bg-[#1c1c1e] animate-pulse" />)}
          </div>
        ) : !user ? (
          <EmptyCTA onClick={() => setShowGate(true)} text="Lock in to start submitting" />
        ) : filtered.length === 0 ? (
          <EmptyCTA onClick={openPicker} text="No clips yet — pick a mission to drop your first one" />
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: '#1c1c1e' }}>
            {filtered.map((s, idx) => (
              <SubmissionRow key={s.id} sub={s} isLast={idx === filtered.length - 1} />
            ))}
          </div>
        )}
      </div>

      {showPicker && (
        <Sheet onClose={() => setShowPicker(false)} title="Pick a mission">
          <div className="relative -mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#8E8E93]" strokeWidth={2.5} />
            <input
              value={pickSearch}
              onChange={(e) => setPickSearch(e.target.value)}
              placeholder="Search live missions"
              className="w-full h-10 pl-9 pr-3 text-[15px] outline-none rounded-[10px] text-white placeholder:text-[#8E8E93]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </div>

          {missionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-[104px] rounded-[16px] bg-white/[0.04] animate-pulse" />)}
            </div>
          ) : missions.filter(m => !pickSearch || m.title.toLowerCase().includes(pickSearch.toLowerCase()) || m.sponsor_name?.toLowerCase().includes(pickSearch.toLowerCase())).length === 0 ? (
            <div className="rounded-[16px] p-8 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Sparkles className="w-6 h-6 text-[#8E8E93] mx-auto mb-2" />
              <p className="text-[15px] font-semibold text-white">No live missions</p>
              <p className="text-[12px] text-[#8E8E93] mt-1">Check back soon for new paid drops</p>
            </div>
          ) : (
            <div className="space-y-2.5 pb-2">
              {missions
                .filter(m => !pickSearch || m.title.toLowerCase().includes(pickSearch.toLowerCase()) || m.sponsor_name?.toLowerCase().includes(pickSearch.toLowerCase()))
                .map((m) => (
                  <MissionPickCard key={m.id} m={m} onPick={() => pickMission(m)} />
                ))}
            </div>
          )}
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to submit clips and earn payouts." />
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: '#1c1c1e' }}>
      <p className="text-[11px] text-[#8E8E93] font-medium">{label}</p>
      <p className="font-apple-tight text-[24px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: accent || '#fff' }}>
        {value}
      </p>
    </div>
  );
}

function SubmissionRow({ sub, isLast }: { sub: Submission; isLast: boolean }) {
  const isOk = sub.status === 'approved' || sub.status === 'paid';
  const isRej = sub.status === 'rejected';
  const StatusIcon = isOk ? Check : isRej ? XIcon : Clock;
  const statusColor = isOk ? '#30D158' : isRej ? '#FF453A' : '#FFCC00';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={isLast ? {} : { borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
    >
      <div className="w-14 h-14 flex-shrink-0 rounded-[10px] overflow-hidden bg-[#2c2c2e]">
        {sub.thumbnail_url ? (
          <img src={sub.thumbnail_url} alt={sub.title || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-5 h-5 text-[#8E8E93]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold text-white tracking-[-0.02em] truncate leading-tight">
          {sub.title || sub.campaign_name || 'Untitled clip'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusIcon className="w-3 h-3" style={{ color: statusColor }} strokeWidth={2.8} />
          <span className="text-[13px] capitalize" style={{ color: statusColor }}>{sub.status}</span>
          {sub.platform && <span className="text-[13px] text-[#8E8E93]">· {sub.platform}</span>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-[15px] font-semibold tabular-nums" style={{ color: '#30D158' }}>
          ${(sub.earned_cents / 100).toFixed(2)}
        </p>
        <p className="text-[11px] text-[#8E8E93] tabular-nums">{(sub.view_count || 0).toLocaleString()} views</p>
      </div>
      <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-[#8E8E93] active:opacity-50 p-1">
        <ExternalLink className="w-[15px] h-[15px]" />
      </a>
    </div>
  );
}

function EmptyCTA({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
      <Film className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
      <p className="text-[17px] font-semibold text-white mb-1">No clips yet</p>
      <p className="text-[13px] text-[#8E8E93] mb-5">{text}</p>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 h-10 px-5 rounded-full bg-[#D4A857] text-white text-[15px] font-semibold active:opacity-60"
      >
        <Plus className="w-4 h-4" strokeWidth={2.8} /> Pick mission
      </button>
    </div>
  );
}

function MissionPickCard({ m, onPick }: { m: PickableMission; onPick: () => void }) {
  const milestones = (m.view_milestones || []).slice(0, 3);
  const bonusTotal = milestones.reduce((s, x) => s + (x.bonus_cents || 0), 0);
  return (
    <button
      onClick={onPick}
      className="w-full text-left rounded-[18px] overflow-hidden active:scale-[0.985] transition-all duration-150 group"
      style={{
        background: 'linear-gradient(180deg, #1f1f21 0%, #161618 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 6px 18px -10px rgba(0,0,0,0.6)',
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex p-2.5 gap-3">
        <div
          className="w-[88px] h-[88px] flex-shrink-0 rounded-[12px] overflow-hidden relative bg-[#2c2c2e]"
          style={{ boxShadow: '0 0 0 0.5px rgba(255,255,255,0.08) inset' }}
        >
          {m.cover_image_url ? (
            <img src={m.cover_image_url} alt={m.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2c2c2e] to-[#1c1c1e]">
              <DollarSign className="w-6 h-6 text-[#48484A]" />
            </div>
          )}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }}
          />
        </div>
        <div className="flex-1 min-w-0 py-0.5 pr-1 flex flex-col">
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-[#8E8E93] font-medium truncate leading-none flex items-center gap-1">
                <span className="truncate">{m.sponsor_name || 'Loopgate Official'}</span>
                <BadgeCheck className="w-[11px] h-[11px] flex-shrink-0 fill-[hsl(214,89%,52%)] text-black" strokeWidth={2.5} />
              </p>
              <h3 className="font-apple-tight text-[15.5px] font-bold text-white tracking-[-0.02em] line-clamp-2 leading-[1.15] mt-1">
                {m.title}
              </h3>
              <div className="mt-1.5">
                <PlatformBadges platforms={m.eligible_platforms} />
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#48484A] flex-shrink-0 mt-0.5 group-active:translate-x-0.5 transition-transform" strokeWidth={2.75} />
          </div>
          <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
            <span className="inline-flex items-center gap-0.5 text-[12px] font-bold tabular-nums leading-none" style={{ color: '#30D158' }}>
              <DollarSign className="w-[11px] h-[11px]" strokeWidth={3} />
              {(m.base_payout_cents / 100).toFixed(2)}
              <span className="text-[#8E8E93] font-medium ml-0.5">base</span>
            </span>
            {bonusTotal > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-[#8E8E93] leading-none">
                <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                up to +${(bonusTotal / 100).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  useEffect(() => {
    const nav = document.querySelector('[data-clippers-bottom-nav]') as HTMLElement | null;
    const prev = nav?.style.display;
    if (nav) nav.style.display = 'none';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      if (nav) nav.style.display = prev || '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center font-apple"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] flex flex-col"
        style={{ background: '#1c1c1e', maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)' }}
      >
        <div className="px-5 pt-3 pb-3 shrink-0 relative">
          <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden mb-4" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] pr-10 pt-1">{title}</h2>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

