import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Plus, ExternalLink, Clock, Check, X as XIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function ClippersSubmissionsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!user) { setShowGate(true); return; }
    if (!videoUrl.includes('http')) { toast.error('Paste a valid video URL'); return; }
    setSubmitting(true);
    const platform = videoUrl.includes('tiktok') ? 'tiktok' :
      videoUrl.includes('instagram') ? 'instagram' :
      videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'youtube' : 'other';
    const { error } = await supabase.from('clip_submissions').insert({
      user_id: user.id, video_url: videoUrl, title: title || null, platform, status: 'pending',
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Clip submitted for review');
    setVideoUrl(''); setTitle(''); setShowSubmit(false); load();
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
    <ClippersLayout title="Clips">
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4 flex items-end justify-between">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Clips</h1>
        <button
          onClick={() => (user ? setShowSubmit(true) : setShowGate(true))}
          className="flex items-center gap-1 h-8 px-3 rounded-full bg-[#0A84FF] text-white text-[14px] font-semibold active:opacity-60 transition-opacity"
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
          <EmptyCTA onClick={() => setShowSubmit(true)} text="No clips yet — drop your first one" />
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: '#1c1c1e' }}>
            {filtered.map((s, idx) => (
              <SubmissionRow key={s.id} sub={s} isLast={idx === filtered.length - 1} />
            ))}
          </div>
        )}
      </div>

      {showSubmit && (
        <Sheet onClose={() => setShowSubmit(false)} title="New Clip">
          <Field label="Video URL">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://tiktok.com/..."
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <Field label="Title (optional)">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 rounded-[14px] bg-[#0A84FF] text-white text-[17px] font-semibold active:opacity-60 transition-opacity flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
          </button>
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to submit clips and earn payouts." />
    </ClippersLayout>
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
        className="inline-flex items-center gap-1 h-10 px-5 rounded-full bg-[#0A84FF] text-white text-[15px] font-semibold active:opacity-60"
      >
        <Plus className="w-4 h-4" strokeWidth={2.8} /> Submit clip
      </button>
    </div>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center font-apple"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        style={{ background: '#1c1c1e' }}
      >
        <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden" />
        <h2 className="text-[22px] font-bold text-white tracking-[-0.022em]">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-[#8E8E93] font-medium px-1">{label}</label>
      {children}
    </div>
  );
}
