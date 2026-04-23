import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Plus, ExternalLink, Clock, Check, X as XIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Button } from '@/components/ui/button';
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
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('clip_submissions')
      .select('id, campaign_name, title, video_url, thumbnail_url, platform, view_count, status, earned_cents, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubs((data || []) as Submission[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      setShowGate(true);
      return;
    }
    if (!videoUrl.includes('http')) {
      toast.error('Paste a valid video URL');
      return;
    }
    setSubmitting(true);
    const platform = videoUrl.includes('tiktok')
      ? 'tiktok'
      : videoUrl.includes('instagram')
      ? 'instagram'
      : videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
      ? 'youtube'
      : 'other';
    const { error } = await supabase.from('clip_submissions').insert({
      user_id: user.id,
      video_url: videoUrl,
      title: title || null,
      platform,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Clip submitted for review');
    setVideoUrl('');
    setTitle('');
    setShowSubmit(false);
    load();
  };

  const counts = {
    all: subs.length,
    pending: subs.filter((s) => s.status === 'pending').length,
    approved: subs.filter((s) => s.status === 'approved' || s.status === 'paid').length,
    rejected: subs.filter((s) => s.status === 'rejected').length,
  };

  const filtered =
    tab === 'all'
      ? subs
      : tab === 'approved'
      ? subs.filter((s) => s.status === 'approved' || s.status === 'paid')
      : subs.filter((s) => s.status === tab);

  const totalEarned = subs.reduce((s, x) => s + (x.earned_cents || 0), 0);

  return (
    <ClippersLayout title="CLIPS">
      {/* Editorial hero */}
      <section className="max-w-6xl mx-auto px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·02</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
          <button
            onClick={() => (user ? setShowSubmit(true) : setShowGate(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gold/40 text-gold font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-gold/10 transition-colors active:opacity-70"
          >
            <Plus className="w-3 h-3" /> Submit
          </button>
        </div>
        <h1 className="font-display text-[56px] sm:text-[72px] leading-[0.85] tracking-tight">
          My <span className="italic text-gold">Clips</span>
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2 tracking-wider uppercase">Track every drop</p>
      </section>

      {/* Counters strip */}
      <section className="border-y border-white/[0.06]" style={{ background: 'hsl(0 0% 2%)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-white/[0.06]">
          <Counter index="01" label="Submitted" value={counts.all} />
          <Counter index="02" label="Approved" value={counts.approved} />
          <Counter index="03" label="Earned" value={`$${(totalEarned / 100).toFixed(0)}`} accent />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-7 space-y-6">
        {/* Tab rail */}
        <div className="flex gap-6 border-b border-white/[0.06] overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase font-bold transition-colors whitespace-nowrap ${
                tab === t.id ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span className={`font-mono text-[10px] tabular-nums ${tab === t.id ? 'text-gold/70' : 'text-muted-foreground/60'}`}>
                {counts[t.id as keyof typeof counts].toString().padStart(2, '0')}
              </span>
              {tab === t.id && (
                <span
                  className="absolute -bottom-px left-0 right-0 h-px bg-gold"
                  style={{ boxShadow: '0 0 6px hsl(var(--gold))' }}
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <EmptyCTA onClick={() => setShowGate(true)} text="Lock in to start submitting clips" />
        ) : filtered.length === 0 ? (
          <EmptyCTA onClick={() => setShowSubmit(true)} text="No clips yet — drop your first one" />
        ) : (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {filtered.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: idx * 0.03 }}
              >
                <SubmissionRow sub={s} index={idx + 1} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Sheet */}
      {showSubmit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] backdrop-blur-md flex items-end sm:items-center justify-center"
          style={{ background: 'hsl(0 0% 0% / 0.85)' }}
          onClick={() => setShowSubmit(false)}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-0 sm:border border-white/[0.08] p-7 space-y-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            style={{ boxShadow: '0 -20px 60px hsl(0 0% 0% / 0.7)' }}
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto sm:hidden" />
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·02 / SUBMIT</span>
              <h2 className="font-display text-[32px] leading-none tracking-tight mt-1">New Clip</h2>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Video URL</label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://tiktok.com/..."
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Title (optional)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmit(false)}
                className="flex-1 h-12 rounded-none border-white/10 bg-transparent text-foreground hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-12 rounded-none bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-[0.2em] uppercase"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ClipperLockGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={load}
        reason="Lock in to submit clips and earn payouts."
      />
    </ClippersLayout>
  );
}

function Counter({ index, label, value, accent }: { index: string; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="font-mono text-[9px] tracking-[0.25em] text-gold/70">{index}</span>
        <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-semibold">{label}</span>
      </div>
      <div className={`font-display text-[30px] leading-none tabular-nums tracking-tight ${accent ? 'text-gold' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

function SubmissionRow({ sub, index }: { sub: Submission; index: number }) {
  const isOk = sub.status === 'approved' || sub.status === 'paid';
  const isRej = sub.status === 'rejected';
  const StatusIcon = isOk ? Check : isRej ? XIcon : Clock;
  const statusColor = isOk ? 'text-emerald-400' : isRej ? 'text-destructive' : 'text-gold';

  return (
    <div className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/[0.02]">
      <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 w-7 tabular-nums">
        {String(index).padStart(2, '0')}
      </span>
      <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-surface-1 border border-white/[0.06]">
        {sub.thumbnail_url ? (
          <img src={sub.thumbnail_url} alt={sub.title || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-5 h-5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center gap-1 text-[9px] tracking-[0.2em] font-mono uppercase ${statusColor}`}>
            <StatusIcon className="w-2.5 h-2.5" /> {sub.status}
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
            {sub.platform || '—'}
          </span>
        </div>
        <p className="font-display text-[18px] leading-tight tracking-tight truncate">
          {sub.title || sub.campaign_name || 'Untitled clip'}
        </p>
      </div>
      <div className="hidden sm:flex flex-col items-end">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase">Views</span>
        <span className="font-display text-[18px] leading-none tabular-nums">{(sub.view_count || 0).toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase">Earned</span>
        <span className="font-display text-[18px] leading-none text-emerald-400 tabular-nums">${(sub.earned_cents / 100).toFixed(2)}</span>
      </div>
      <a
        href={sub.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground/60 hover:text-gold transition-colors p-1"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function EmptyCTA({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div className="border border-white/[0.06] p-12 text-center">
      <Film className="w-7 h-7 text-muted-foreground/40 mx-auto mb-4" />
      <p className="font-display text-[28px] tracking-tight mb-1">No clips yet</p>
      <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-5">{text}</p>
      <Button
        onClick={onClick}
        className="rounded-none bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-[0.25em] uppercase h-11 px-6"
      >
        <Plus className="w-4 h-4 mr-1" /> Submit
      </Button>
    </div>
  );
}