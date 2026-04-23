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

  // Submit form state
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
    const platform = videoUrl.includes('tiktok') ? 'tiktok' : videoUrl.includes('instagram') ? 'instagram' : videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'youtube' : 'other';
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

  const filtered = tab === 'all'
    ? subs
    : tab === 'approved'
    ? subs.filter((s) => s.status === 'approved' || s.status === 'paid')
    : subs.filter((s) => s.status === tab);

  return (
    <ClippersLayout title="MY CLIPS">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl mb-1">My Submissions</h1>
            <p className="text-sm text-muted-foreground">Track every clip you've dropped.</p>
          </div>
          <Button
            onClick={() => (user ? setShowSubmit(true) : setShowGate(true))}
            className="bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-wide h-10"
          >
            <Plus className="w-4 h-4 mr-1" /> Submit
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-2 px-1 flex items-center gap-2 text-sm whitespace-nowrap transition-colors border-b-2 ${
                tab === t.id ? 'border-gold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-display ${tab === t.id ? 'bg-gold/20 text-gold' : 'bg-surface-1 text-muted-foreground'}`}>
                {counts[t.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-surface-1 border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <EmptyCTA onClick={() => setShowGate(true)} text="Lock in to start submitting clips." />
        ) : filtered.length === 0 ? (
          <EmptyCTA onClick={() => setShowSubmit(true)} text="No clips yet. Drop your first one." />
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <SubmissionCard key={s.id} sub={s} />
            ))}
          </div>
        )}
      </div>

      {/* Submit Sheet */}
      {showSubmit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowSubmit(false)}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-1 border border-border sm:rounded-2xl rounded-t-3xl p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <h2 className="font-display text-2xl">Submit Clip</h2>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste TikTok / IG / YouTube URL"
              className="h-12 bg-surface-0"
            />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="h-12 bg-surface-0"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubmit(false)} className="flex-1 h-11">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 h-11 bg-gold hover:bg-gold/90 text-gold-foreground"
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

function SubmissionCard({ sub }: { sub: Submission }) {
  const statusColor =
    sub.status === 'approved' || sub.status === 'paid'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : sub.status === 'rejected'
      ? 'text-destructive border-destructive/40 bg-destructive/10'
      : 'text-gold border-gold/40 bg-gold/10';

  const StatusIcon = sub.status === 'approved' || sub.status === 'paid' ? Check : sub.status === 'rejected' ? XIcon : Clock;

  return (
    <div className="bg-surface-1 border border-border rounded-2xl p-3 flex gap-3">
      <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-surface-0 relative">
        {sub.thumbnail_url ? (
          <img src={sub.thumbnail_url} alt={sub.title || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-6 h-6 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-display text-sm line-clamp-2 flex-1">{sub.title || sub.campaign_name || 'Untitled clip'}</p>
          <span className={`px-2 py-0.5 border rounded-full text-[10px] font-display tracking-wider uppercase flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {sub.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-auto">{sub.campaign_name || sub.platform || 'Submission'}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>{(sub.view_count || 0).toLocaleString()} views</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-display">${(sub.earned_cents / 100).toFixed(2)}</span>
            <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyCTA({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center">
      <Film className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
      <p className="font-display mb-1">No clips yet</p>
      <p className="text-sm text-muted-foreground mb-4">{text}</p>
      <Button onClick={onClick} className="bg-gold hover:bg-gold/90 text-gold-foreground">
        <Plus className="w-4 h-4 mr-1" /> Submit clip
      </Button>
    </div>
  );
}