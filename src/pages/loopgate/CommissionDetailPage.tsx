import { useState, useEffect, useRef, useCallback } from 'react';
import MissionLobbyChat from '@/components/loopgate/MissionLobbyChat';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ArrowLeft, Clock, Users, CheckCircle2, Send, ExternalLink,
  MessageSquare, Loader2, Star, Zap, ShieldCheck, AlertTriangle,
  HelpCircle, ChevronRight, ChevronLeft, Film, Target, Music, Trophy,
  Flame, Info, X, Crosshair, Play, FileText, Pencil, FolderOpen, Eye, Ticket,
  ImagePlus, Upload
} from 'lucide-react';
import { useCommissionDetail, type SubmissionRating, RATING_PAYOUTS, RATING_COLORS } from '@/hooks/useCommissions';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useTempProfile } from '@/hooks/useTempProfile';

const teko = { fontFamily: 'Teko, sans-serif' };

/* ── Platform verification helper ── */
function detectPlatform(u: string) {
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('streamable.com')) return 'streamable';
  return 'other';
}

function extractPlatformUsername(url: string, platform: string): string | null {
  try {
    if (platform === 'tiktok') { const m = url.match(/@([a-zA-Z0-9_.]+)/); return m ? m[1].toLowerCase() : null; }
    if (platform === 'instagram') { const m = url.match(/instagram\.com\/(?:reel|p|stories)\/[^/]+|instagram\.com\/([a-zA-Z0-9_.]+)/); return m && m[1] ? m[1].toLowerCase() : null; }
    if (platform === 'youtube') { const m = url.match(/@([a-zA-Z0-9_-]+)/); return m ? m[1].toLowerCase() : null; }
  } catch { /* ignore */ }
  return null;
}

/* ── Lobby Presence Hook ── */
function useLobbyPresence(commissionId: string | undefined) {
  const { user, profile, loading } = useAuth();
  const { profile: tempProfile } = useTempProfile();
  const [visitors, setVisitors] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const trackedRef = useRef(false);

  // Track presence — works for both real and temp profiles
  useEffect(() => {
    if (!commissionId || loading) return;

    const trackPresence = async () => {
      if (user && profile) {
        // Real authenticated user
        await supabase.from('mission_lobby_presence' as any).upsert({
          commission_id: commissionId,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: 'user_id,commission_id' } as any);
        trackedRef.current = true;
      }
    };
    trackPresence();

    const interval = setInterval(trackPresence, 30000);
    return () => clearInterval(interval);
  }, [commissionId, user, profile, loading]);

  // Fetch all visitors
  useEffect(() => {
    if (!commissionId) return;

    const fetchVisitors = async () => {
      const { data } = await supabase
        .from('mission_lobby_presence' as any)
        .select('user_id, username, avatar_url')
        .eq('commission_id', commissionId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setVisitors(data as any);
    };
    fetchVisitors();

    // Re-fetch after a short delay to catch our own insert
    const timeout = setTimeout(fetchVisitors, 2000);
    return () => clearTimeout(timeout);
  }, [commissionId, user, profile]);

  return visitors;
}

/* ── Lobby Heads Component ── */
function LobbyHeads({ visitors }: { visitors: { user_id: string; username: string; avatar_url: string | null }[] }) {
  const navigate = useNavigate();
  if (visitors.length === 0) return null;
  
  const shown = visitors.slice(0, 12);
  const extra = visitors.length - shown.length;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        {shown.map((v, i) => (
          <motion.button
            key={v.user_id}
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => navigate(`/u/${v.username}`)}
            className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-background hover:border-emerald-500/50 hover:z-10 hover:scale-110 transition-all shrink-0"
            style={{ zIndex: shown.length - i }}
          >
            {v.avatar_url ? (
              <img src={v.avatar_url} alt={v.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-2 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {v.username?.[0]?.toUpperCase()}
              </div>
            )}
          </motion.button>
        ))}
        {extra > 0 && (
          <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background flex items-center justify-center shrink-0" style={{ zIndex: 0 }}>
            <span className="text-[9px] font-black text-muted-foreground">+{extra}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-bold text-muted-foreground">
          {visitors.length} in lobby
        </span>
      </div>
    </div>
  );
}

/* ── Submit Form ── */
function SubmitForm({ onSubmit, disabled, userId, previousSubmissions }: {
  onSubmit: (url: string, platform: string, message: string) => Promise<void>;
  disabled: boolean;
  userId?: string;
  previousSubmissions: number;
}) {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!url.trim() || !userId) { setVerified(null); return; }
    const platform = detectPlatform(url);
    if (platform === 'other' || platform === 'streamable') { setVerified(null); return; }
    const timer = setTimeout(async () => {
      setChecking(true);
      const urlUsername = extractPlatformUsername(url, platform);
      if (!urlUsername) { setVerified(null); setChecking(false); return; }
      const { data } = await supabase.from('connected_platforms').select('platform_username').eq('user_id', userId).eq('platform', platform);
      if (data && data.length > 0) { setVerified(data.some(p => p.platform_username.toLowerCase() === urlUsername)); } else { setVerified(null); }
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [url, userId]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(url.trim(), detectPlatform(url), message.trim());
      toast.success('Edit submitted!');
      setUrl(''); setMessage(''); setVerified(null);
    } catch (err: any) { toast.error(err.message || 'Failed to submit'); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste your edit link (TikTok, YouTube, IG)" className="h-11 pr-8 bg-black/40 border-white/10 rounded-xl text-sm" disabled={disabled} />
        {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />}
        {!checking && verified === true && <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />}
        {!checking && verified === false && <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400" />}
      </div>
      {verified === true && <p className="text-[10px] text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified — matches your connected account</p>}
      {verified === false && <p className="text-[10px] text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> This link doesn't match your connected account</p>}
      <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Optional note..." className="min-h-[50px] resize-none bg-black/40 border-white/10 rounded-xl text-sm" disabled={disabled} />
      <Button onClick={handleSubmit} disabled={submitting || !url.trim() || disabled} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Edit</>}
      </Button>
    </div>
  );
}

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];

/* ── Rating Modal ── */
function RatingModal({ submission, onRate, onClose, getPayoutForRating }: {
  submission: any;
  onRate: (id: string, rating: SubmissionRating, feedback: string) => Promise<void>;
  onClose: () => void;
  getPayoutForRating: (r: SubmissionRating) => number;
}) {
  const [feedback, setFeedback] = useState('');
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState(submission.submission_url || '');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadThumbnail = async (submissionId: string): Promise<string | null> => {
    if (!thumbnailFile) return null;
    const ext = thumbnailFile.name.split('.').pop() || 'jpg';
    const path = `${submissionId}.${ext}`;
    const { error } = await supabase.storage.from('submission-thumbnails').upload(path, thumbnailFile, { upsert: true });
    if (error) { console.error('Thumbnail upload error:', error); return null; }
    const { data: { publicUrl } } = supabase.storage.from('submission-thumbnails').getPublicUrl(path);
    return publicUrl;
  };

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    setSubmitting(true);
    try {
      // Upload thumbnail and update video URL if changed
      const thumbUrl = await uploadThumbnail(submission.id);
      const updates: Record<string, any> = {};
      if (thumbUrl) updates.thumbnail_url = thumbUrl;
      if (videoUrl.trim() && videoUrl.trim() !== submission.submission_url) updates.submission_url = videoUrl.trim();
      if (Object.keys(updates).length > 0) {
        await supabase.from('commission_submissions').update(updates as any).eq('id', submission.id);
      }
      await onRate(submission.id, selectedRating, feedback.trim());
      const payout = getPayoutForRating(selectedRating);
      toast.success(payout > 0 ? `Rated ${selectedRating} — $${(payout / 100).toFixed(2)} instant payout to @${submission.username}` : `Rated ${selectedRating} — Index points only`);
      onClose();
    } catch { toast.error('Rating failed'); }
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border/30 w-full max-w-md p-5 space-y-4 rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 style={teko} className="text-xl text-foreground flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> RATE @{submission.username}</h3>
        <div className="bg-black/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
              {submission.avatar_url ? <img src={submission.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{submission.username?.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="text-sm font-semibold text-foreground">@{submission.username}</span>
          </div>
          <button onClick={() => window.open(submission.submission_url, '_blank', 'noopener,noreferrer')} className="text-xs text-emerald-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Watch Edit</button>
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Showcase Thumbnail</label>
          <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} className="hidden" />
          {thumbnailPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-24 object-cover" />
              <button onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="absolute top-1 right-1 bg-black/70 rounded-full p-1"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => thumbnailInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-white/20 transition-colors">
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Tap to add thumbnail</span>
            </button>
          )}
        </div>

        {/* Video URL */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Video URL</label>
          <input
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://tiktok.com/... or youtube.com/..."
            className="w-full h-10 px-3 bg-black/30 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <p className="text-[9px] text-muted-foreground/50 mt-1">Override the submission video link for showcase</p>
        </div>

        <div>
          <div className="grid grid-cols-6 gap-1.5">
            {RATINGS.map(r => {
              const payout = getPayoutForRating(r);
              const isSelected = selectedRating === r;
              return (
                <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${isSelected ? RATING_COLORS[r] + ' ring-2 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'}`}>
                  <span className={`text-xl font-black ${isSelected ? '' : 'text-foreground'}`}>{r}</span>
                  {payout > 0 ? <span className="text-[9px] font-bold text-emerald-400 mt-0.5">${(payout / 100 % 1 === 0) ? (payout / 100).toFixed(0) : (payout / 100).toFixed(2)}</span> : r === 'F' ? <span className="text-[8px] font-bold text-amber-400 mt-0.5">🎰 $50</span> : <span className="text-[9px] text-muted-foreground mt-0.5">IDX</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
        <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Quick note on the edit..." className="min-h-[60px] resize-none rounded-xl bg-black/30 border-white/10" />
        <Button onClick={handleRate} disabled={submitting || !selectedRating} className="w-full bg-amber-500 hover:bg-amber-400 text-background font-bold text-base py-5 rounded-xl">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4 mr-2" /> Confirm {selectedRating || '...'}</>}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function RatingBadge({ rating, earnedCents }: { rating: string; earnedCents: number }) {
  const colors = RATING_COLORS[rating as SubmissionRating] || 'text-muted-foreground bg-muted/30 border-border/30';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black ${colors}`}>
      <span className="text-base">{rating}</span>
      {earnedCents > 0 && <span className="text-emerald-400 font-bold text-[10px]">+${(earnedCents / 100).toFixed(2)}</span>}
    </div>
  );
}

/* ── Submission Card ── */
function SubmissionCard({ sub, canRate, onRate }: { sub: any; canRate: boolean; onRate: (sub: any) => void }) {
  return (
    <div className={`bg-black/20 backdrop-blur-sm rounded-xl border p-3 ${
      sub.status === 'accepted' ? 'border-emerald-500/20' :
      sub.status === 'declined' ? 'border-red-500/20 opacity-60' : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
            {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{sub.username?.charAt(0).toUpperCase()}</span>}
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">@{sub.username}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')} className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> View</button>
              {sub.platform && <span className="text-[9px] text-muted-foreground capitalize">{sub.platform}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sub.status === 'pending' && canRate ? (
            <Button size="sm" onClick={() => onRate(sub)} className="bg-amber-500 hover:bg-amber-400 text-background text-xs h-8 font-bold rounded-lg"><Star className="w-3.5 h-3.5 mr-1" /> Rate</Button>
          ) : sub.rating ? (
            <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} />
          ) : sub.status !== 'pending' ? (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${sub.status === 'accepted' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{sub.status}</span>
          ) : (
            <span className="text-[9px] text-muted-foreground">Pending</span>
          )}
        </div>
      </div>
      {sub.message && <p className="text-xs text-muted-foreground mt-2 italic">"{sub.message}"</p>}
      {sub.feedback && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Feedback:</p>
          <p className="text-xs text-foreground/80">"{sub.feedback}"</p>
        </div>
      )}
      {sub.earned_cents > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 font-bold"><DollarSign className="w-3 h-3" /> ${(sub.earned_cents / 100).toFixed(2)} paid instantly</div>
      )}
    </div>
  );
}

/* ── Showcase Card ── */
function ShowcaseCard({ sub, canEdit = false }: { sub: any; canEdit?: boolean }) {
  const ratingColor = sub.rating === 'S' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    sub.rating === 'A' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
    sub.rating === 'B' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
    'text-foreground/60 border-white/10 bg-white/5';

  const [uploading, setUploading] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(sub.thumbnail_url || null);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${sub.id}.${ext}`;
    const { error } = await supabase.storage.from('submission-thumbnails').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('submission-thumbnails').getPublicUrl(path);
    await supabase.from('commission_submissions').update({ thumbnail_url: publicUrl } as any).eq('id', sub.id);
    setThumbUrl(publicUrl);
    toast.success('Thumbnail uploaded!');
    setUploading(false);
  };

  return (
    <div className="shrink-0 w-[160px] bg-black/30 backdrop-blur-sm border border-white/5 overflow-hidden rounded-xl hover:border-white/10 transition-all snap-start">
      {/* Thumbnail */}
      <input ref={thumbInputRef} type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
      {thumbUrl ? (
        <div className="relative w-full h-[90px] cursor-pointer group" onClick={() => window.open(sub.submission_url, '_blank')}>
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
      ) : canEdit ? (
        <button onClick={() => thumbInputRef.current?.click()} className="w-full h-[90px] bg-black/40 flex flex-col items-center justify-center gap-1 hover:bg-black/50 transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
            <>
              <ImagePlus className="w-4 h-4 text-muted-foreground/40" />
              <span className="text-[7px] text-muted-foreground/30 font-bold uppercase">Add Thumbnail</span>
            </>
          )}
        </button>
      ) : null}
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-white/5">
        <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${ratingColor}`}>
          <span className="text-xs font-black">{sub.rating}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-foreground truncate block">@{sub.username}</span>
          {sub.earned_cents > 0 && <span className="text-[8px] font-black text-emerald-400">+${(sub.earned_cents / 100).toFixed(2)}</span>}
        </div>
      </div>
      <div className="px-2.5 py-1.5">
        <button onClick={() => window.open(sub.submission_url, '_blank')} className="text-[9px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Watch</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* ══                    COMMISSION DETAIL PAGE                       ══ */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function CommissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { commission, submissions, loading, submitEdit, rateSubmission } = useCommissionDetail(id);
  const { user } = useAuth();
  const { isDev, isAdmin } = useUserRoles(user?.id);
  const isStaff = isDev || isAdmin;
  const isPoster = !!user && commission?.created_by === user.id;
  const canRate = isStaff || isPoster;
  const [reviewingSubmission, setReviewingSubmission] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showQoiInfo, setShowQoiInfo] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefText, setBriefText] = useState('');
  const showcaseRef = useRef<HTMLDivElement>(null);
  const visitors = useLobbyPresence(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="text-[11px] text-muted-foreground">Loading mission...</span>
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Mission not found</p>
        <Link to="/index" className="text-emerald-400 text-sm hover:underline">← Back to Arena</Link>
      </div>
    );
  }

  const payoutMap = commission.custom_payouts as Record<string, number> | null;
  const getPayoutForRating = (r: SubmissionRating) => payoutMap ? (payoutMap[r] ?? RATING_PAYOUTS[r]) : RATING_PAYOUTS[r];
  const maxPayout = (commission.payout_cents / 100).toFixed(0);
  const slotsLeft = commission.max_slots - commission.accepted_count;
  const isOpen = commission.status === 'open' && slotsLeft > 0 && (!commission.deadline || new Date(commission.deadline) > new Date());

  const mySubmissions = submissions.filter(s => s.user_id === user?.id);
  const canSubmit = isOpen && !!user && !isPoster;

  const coverUrl = (commission as any).cover_url || commission.thumbnail_url;


  const ratedSubmissions = submissions.filter(s => s.rating);
  const RANK_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
  const leaderboard = [...ratedSubmissions].sort((a, b) => (RANK_ORDER[a.rating || 'F'] || 5) - (RANK_ORDER[b.rating || 'F'] || 5));
  const progressPercent = commission.max_slots > 0 ? Math.min(100, (commission.accepted_count / commission.max_slots) * 100) : 0;

  const scrollShowcase = (dir: 'left' | 'right') => {
    if (!showcaseRef.current) return;
    showcaseRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111114' }}>
      {/* ═══ HERO — Cinematic immersive header ═══ */}
      <div className="relative w-full aspect-[9/14] max-h-[480px]">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
        )}
        {/* Layered gradients for depth */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #111114 0%, #111114cc 30%, transparent 100%)' }} />
        <div className="absolute inset-0" style={{ top: '50%', background: 'linear-gradient(to top, #111114cc 0%, transparent 100%)' }} />

        {/* Back button — frosted glass */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        {/* Content over hero */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-4 pb-5">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <div className="flex items-center gap-0">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <div className="bg-black/50 backdrop-blur-xl px-3 py-1 rounded-r-lg flex items-center gap-2">
                {isOpen && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/90">
                  {isOpen ? 'Live' : commission.status === 'filled' ? 'Filled' : 'Closed'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">Mission</span>
              </div>
            </div>
          </motion.div>

          {/* Payout pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-3"
          >
            <span style={teko} className="text-5xl font-black text-emerald-400 leading-none drop-shadow-lg">${maxPayout}</span>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-4">
            {commission.artist_name && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-0.5">{commission.artist_name}</p>
            )}
            <h1 style={teko} className="text-3xl font-black uppercase text-white leading-[0.95]">
              {commission.song_name || commission.title}
            </h1>
          </motion.div>

          {/* Payout timeline — S to F */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/[0.08] backdrop-blur-xl rounded-xl border border-white/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">Payout Scale</span>
              <button onClick={() => setShowQoiInfo(true)} className="flex items-center gap-1 text-[8px] font-bold text-white/40 hover:text-white/70 transition-colors">
                <Info className="w-3 h-3" /> What's QOI?
              </button>
            </div>
            <div className="relative flex items-center gap-0">
              {/* Timeline line */}
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-amber-500/60 via-emerald-500/40 via-blue-500/30 to-red-500/20" />
              {[
                { rank: 'S', color: 'text-amber-400', dotColor: 'bg-amber-400', pay: getPayoutForRating('S'), qoi: '90+' },
                { rank: 'A', color: 'text-emerald-400', dotColor: 'bg-emerald-400', pay: getPayoutForRating('A'), qoi: '75+' },
                { rank: 'B', color: 'text-blue-400', dotColor: 'bg-blue-400', pay: getPayoutForRating('B'), qoi: '60+' },
                { rank: 'C', color: 'text-cyan-400', dotColor: 'bg-cyan-400', pay: getPayoutForRating('C'), qoi: '45+' },
                { rank: 'D', color: 'text-orange-400', dotColor: 'bg-orange-400', pay: getPayoutForRating('D'), qoi: '30+' },
                { rank: 'F', color: 'text-red-400', dotColor: 'bg-red-400', pay: getPayoutForRating('F'), qoi: '<30' },
              ].map((t) => (
                <div key={t.rank} className="flex-1 flex flex-col items-center relative z-10">
                  <span className={`text-[10px] font-black ${t.color} leading-none`}>{t.rank}</span>
                  <span className={`text-[9px] font-bold mt-0.5 ${t.rank === 'F' ? 'text-purple-400' : 'text-white'}`}>
                    {t.pay > 0 ? `$${(t.pay / 100 % 1 === 0) ? (t.pay / 100).toFixed(0) : (t.pay / 100).toFixed(2)}` : t.rank === 'F' ? '50 XP' : 'IDX'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${t.dotColor} my-1 shadow-sm`} />
                  <span className="text-[7px] text-white/35 font-medium">{t.qoi}</span>
                </div>
              ))}
            </div>
            {/* Jackpot indicator */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-center gap-2">
              <span className="text-sm">🎰</span>
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">Jackpot Edit: $50 bonus at 100k+ views</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="px-4 pb-24 space-y-5 -mt-1">

        {/* ── LOBBY ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-0 py-2"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-black text-foreground uppercase tracking-[0.12em]">
              Editors {visitors.length > 0 ? `(${visitors.length})` : ''}
            </span>
          </div>
          {visitors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {visitors.map((v) => (
                <Link key={v.user_id} to={`/editor/${v.username}`} className="flex flex-col items-center gap-1.5 w-16">
                  <div className="w-14 h-14 rounded-full bg-muted border-2 border-border overflow-hidden">
                    {v.avatar_url ? (
                      <img src={v.avatar_url} alt={v.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                        {v.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">{v.username}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground italic">No one here yet — be the first</span>
            </div>
          )}
        </motion.div>

        {/* ── PROGRESS ── */}
        <div className="bg-surface-1 border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Slots</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {commission.accepted_count}/{commission.max_slots} accepted
            </span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground">{slotsLeft > 0 ? `${slotsLeft} remaining` : 'All slots filled'}</span>
            {submissions.length > 0 && <span className="text-[9px] text-muted-foreground">{submissions.length} submitted</span>}
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex gap-2">
          {canSubmit ? (
            <button onClick={() => setShowSubmitModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-sm rounded-xl transition-colors active:scale-[0.98]">
              <Send className="w-4 h-4" /> Submit Edit
            </button>
          ) : !user ? (
            <Link to="/login" className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-black uppercase tracking-wider text-sm rounded-xl">
              <Send className="w-4 h-4" /> Sign In to Submit
            </Link>
          ) : null}
          <Link to={`/studio?mission=${id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 text-foreground font-black uppercase tracking-wider text-sm rounded-xl transition-colors">
            <Film className="w-4 h-4 text-emerald-400" /> Go Edit
          </Link>
        </div>

        {/* ── SCENEPACKS BUTTON ── */}
        {(commission as any).scenepack_url && (
          <a href={(commission as any).scenepack_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 py-3.5 w-full bg-surface-1 border border-border hover:border-foreground/20 text-foreground font-black uppercase tracking-wider text-sm rounded-xl transition-colors active:scale-[0.98]">
            <FolderOpen className="w-4 h-4 text-amber-400" /> Go Get Scenepacks
          </a>
        )}

        {/* ── MISSION BRIEF ── */}
        <div className="rounded-xl overflow-hidden">
          <button onClick={() => setShowBrief(!showBrief)}
            className="w-full flex items-center justify-between py-3.5 px-4 bg-surface-1 border border-border hover:border-foreground/20 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider">Mission Brief</span>
            </div>
            <motion.div animate={{ rotate: showBrief ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showBrief && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="bg-surface-1 border border-t-0 border-border rounded-b-xl p-4">
                  {editingBrief ? (
                    <div className="space-y-2">
                      <Textarea value={briefText} onChange={e => setBriefText(e.target.value)} placeholder="Write the mission brief..." className="min-h-[120px] resize-none bg-surface-2 border-border text-xs rounded-xl" />
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex-1 rounded-lg"
                          onClick={async () => {
                            const { error } = await supabase.from('commissions').update({ description: briefText } as any).eq('id', id);
                            if (error) { toast.error('Failed to save brief'); return; }
                            toast.success('Brief saved!'); setEditingBrief(false); window.location.reload();
                          }}>Save Brief</Button>
                        <Button size="sm" variant="outline" className="text-xs rounded-lg" onClick={() => setEditingBrief(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {commission.description ? (
                        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{commission.description}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <FileText className="w-5 h-5 text-muted-foreground/20" />
                          <p className="text-[10px] text-muted-foreground/50 text-center italic">Looks like this mission still doesn't know what its objective is.</p>
                        </div>
                      )}
                      {canRate && (
                        <button onClick={() => { setBriefText(commission.description || ''); setEditingBrief(true); }}
                          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-foreground/30 rounded-xl transition-colors">
                          <Pencil className="w-3 h-3" /> {commission.description ? 'Edit Brief' : 'Add Brief'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div id="how-it-works-section" className="rounded-2xl overflow-hidden">
          <button onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full flex items-center justify-between py-3 px-4 bg-white/3 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-black text-foreground uppercase tracking-wider">How Missions Work</span>
            </div>
            <motion.div animate={{ rotate: showHowItWorks ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showHowItWorks && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="bg-black/20 border border-t-0 border-white/5 rounded-b-2xl p-4 space-y-3">
                  {[
                    { step: '01', icon: Target, label: 'Follow the brief', desc: 'Read the mission brief and understand the creative direction' },
                    { step: '02', icon: Film, label: 'Create your edit', desc: 'Use any editing software (CapCut, Adobe, Premiere, etc.)' },
                    { step: '03', icon: Send, label: 'Post on socials', desc: 'Upload to TikTok, YouTube, or Instagram and paste the link' },
                    { step: '04', icon: Star, label: 'Get rated & paid', desc: 'QOI = Quality + Originality + Impact, scored 1-10 each by judges. Your combined score determines your class (S through F)' },
                    { step: '05', icon: DollarSign, label: 'Earn instantly', desc: 'Higher QOI = higher class = bigger payout. Lower classes still earn Index reputation points to boost your rank' },
                  ].map(({ step, icon: Icon, label, desc }) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-emerald-400">{step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3 h-3 text-foreground/40" />
                          <span className="text-xs font-bold text-foreground/80">{label}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── LEADERBOARD ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Leaderboard</span>
            </div>
            {leaderboard.length > 0 && <span className="text-[9px] text-muted-foreground">{leaderboard.length} rated</span>}
          </div>
          {leaderboard.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl py-8 flex flex-col items-center gap-2">
              <Trophy className="w-5 h-5 text-muted-foreground/15" />
              <p className="text-[10px] text-muted-foreground/40 font-bold">No rated edits yet</p>
              <p className="text-[8px] text-muted-foreground/25">Submit your edit to be the first on the board</p>
            </div>
          ) : (
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((sub, i) => {
                const isTop3 = i < 3;
                return (
                  <div key={sub.id} className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl ${isTop3 ? 'bg-black/20 border border-white/5' : ''}`}>
                    <span className={`text-[11px] font-black w-5 text-center tabular-nums ${i === 0 ? 'text-gold' : i === 1 ? 'text-foreground/60' : i === 2 ? 'text-amber-700' : 'text-muted-foreground/30'}`}>#{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden shrink-0">
                      {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[9px] font-bold text-muted-foreground">{sub.username?.[0]?.toUpperCase()}</span>}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate flex-1">@{sub.username}</span>
                    <div className={`px-2 py-0.5 rounded-md border text-[10px] font-black ${RATING_COLORS[sub.rating as SubmissionRating] || 'border-border text-muted-foreground'}`}>{sub.rating}</div>
                    {sub.earned_cents > 0 && <span className="text-[9px] font-bold text-emerald-400">${(sub.earned_cents / 100).toFixed(2)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── EDIT SHOWCASE ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-gold" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Edit Showcase</span>
            </div>
          </div>
          {ratedSubmissions.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl py-8 flex flex-col items-center gap-2">
              <Play className="w-5 h-5 text-muted-foreground/15" />
              <p className="text-[10px] text-muted-foreground/40 font-bold">No edits to showcase yet</p>
              <p className="text-[8px] text-muted-foreground/25">Rated edits will appear here as a carousel</p>
            </div>
          ) : (
            <div ref={showcaseRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth pb-2 snap-x snap-mandatory">
              {ratedSubmissions.map(sub => <ShowcaseCard key={sub.id} sub={sub} canEdit={canRate} />)}
            </div>
          )}
        </div>

        {/* ── MY SUBMISSIONS ── */}
        {mySubmissions.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Your Submissions ({mySubmissions.length})
            </h3>
            <div className="space-y-2">
              {mySubmissions.map(sub => (
                <div key={sub.id} className={`rounded-xl border p-3 flex items-center gap-3 ${
                  sub.rating ? 'bg-emerald-950/20 border-emerald-500/15' : sub.status === 'declined' ? 'bg-red-950/20 border-red-500/15' : 'bg-black/20 border-white/5'
                }`}>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => window.open(sub.submission_url, '_blank', 'noopener,noreferrer')} className="text-xs text-emerald-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {sub.platform || 'View'}</button>
                    {sub.earned_cents > 0 && <p className="text-[10px] text-emerald-400 font-bold mt-0.5">+${(sub.earned_cents / 100).toFixed(2)} earned</p>}
                    {sub.feedback && <p className="text-[10px] text-muted-foreground mt-1 italic">"{sub.feedback}"</p>}
                  </div>
                  {sub.rating ? <RatingBadge rating={sub.rating} earnedCents={sub.earned_cents} /> : <span className="text-[9px] text-amber-400 font-bold">Pending</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit again CTA */}
        {canSubmit && (
          <button onClick={() => setShowSubmitModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-sm rounded-xl transition-colors">
            <Send className="w-4 h-4" /> {mySubmissions.length > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
          </button>
        )}

        {!user && isOpen && (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to submit your edit</p>
          </div>
        )}

        {/* ── ALL SUBMISSIONS (Staff/Poster) ── */}
        {canRate && submissions.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> All Submissions ({submissions.length})
              <span className="text-[9px] text-muted-foreground ml-auto font-mono">{submissions.filter(s => s.status === 'pending').length} pending</span>
            </h3>
            <div className="space-y-2">
              {submissions.map(sub => <SubmissionCard key={sub.id} sub={sub} canRate={canRate} onRate={setReviewingSubmission} />)}
            </div>
          </div>
        )}

        {/* ── MISSION CHAT ── */}
        <MissionLobbyChat missionId={id!} />

        {/* ── JACKPOT EDIT SHOWCASE ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden relative"
        >
          {/* Cinematic dark poster bg */}
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0ibiI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjAuMDMiLz48L3N2Zz4=')] opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-black/60" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          
          <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🎰</div>
              <div>
                <h3 style={teko} className="text-xl font-black text-white uppercase leading-none tracking-wide">Jackpot Edit</h3>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.15em]">$50 Viral Bonus</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-white/60 leading-relaxed mb-4">
              Go viral with <span className="text-white font-bold">{commission.song_name || commission.title}</span>. 
              Hit <span className="text-amber-400 font-bold">100k+ views</span> on any platform — earn 
              <span className="text-emerald-400 font-bold"> $50</span>, the Jackpot Badge, and get showcased below.
            </p>

            {/* Steps — compact inline */}
            <div className="flex gap-2 mb-4">
              {[
                { num: '01', text: 'Submit your edit' },
                { num: '02', text: 'Go viral — 100k+ views' },
                { num: '03', text: 'Claim $50 + Badge' },
              ].map(s => (
                <div key={s.num} className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 text-center">
                  <span className="text-[8px] font-black text-amber-400/60 uppercase tracking-widest block">{s.num}</span>
                  <p className="text-[9px] text-white/70 font-medium mt-0.5 leading-tight">{s.text}</p>
                </div>
              ))}
            </div>

            {/* Winner showcase — empty state */}
            <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />
              <div className="relative flex flex-col items-center py-6 text-center">
                <div className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center mb-2.5">
                  <Trophy className="w-4 h-4 text-white/15" />
                </div>
                <p style={teko} className="text-sm font-bold text-white/30 uppercase tracking-wider">No Winner Yet</p>
                <p className="text-[9px] text-white/15 mt-0.5">First to 100k views claims the Jackpot</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {reviewingSubmission && (
          <RatingModal submission={reviewingSubmission} onRate={rateSubmission} onClose={() => setReviewingSubmission(null)} getPayoutForRating={getPayoutForRating} />
        )}
      </AnimatePresence>

      {/* QOI Info Modal — full bottom sheet */}
      <AnimatePresence>
        {showQoiInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowQoiInfo(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full bg-[#1a1a1a] border-t border-white/15 rounded-t-3xl flex flex-col" style={{ maxHeight: 'calc(100dvh - 60px)' }}>
              
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pb-8">
                {/* Header with Loopy character */}
                <div className="flex items-center gap-3 mb-5 mt-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🐱</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">What's QOI?</h3>
                    <p className="text-[10px] text-muted-foreground">Loopy explains how scoring works</p>
                  </div>
                  <button onClick={() => setShowQoiInfo(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>

                {/* Intro */}
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-5">
                  QOI stands for <span className="text-foreground font-bold">Quality + Originality + Impact</span>. Judges score each pillar 1–10, giving you a combined score out of 30 that maps to your class (S through F).
                </p>

                {/* Three pillars */}
                <div className="space-y-2.5 mb-5">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Quality (1-10)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Clean cuts, smooth transitions, color grading, audio sync. Technical precision matters.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Originality (1-10)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Unique concept, creative angles, effects that haven't been recycled. Stand out from the crowd.</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Impact (1-10)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Emotional punch, replay value, shareability. Does it make someone stop scrolling?</p>
                  </div>
                </div>

                {/* Insider Tips */}
                <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 mb-4">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">🔓 Insider Tips</span>
                  <div className="space-y-2.5">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">→ First 3 seconds matter most.</span> Judges form their first impression instantly — hook hard.
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">→ Audio sync is free points.</span> Beat-matching your cuts to the music is the easiest way to boost Quality score.
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">→ Post performance matters.</span> High views, likes, and comments signal Impact — judges notice virality.
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">→ Don't copy trending templates.</span> Judges penalize recycled concepts hard on Originality.
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">→ Color grade everything.</span> Raw footage with no grading instantly drops your Quality ceiling.
                    </p>
                  </div>
                </div>

                {/* Jackpot Edit Bonus */}
                <div className="border border-amber-500/20 bg-amber-500/[0.04] rounded-xl p-4 mb-4">
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">🎰 Jackpot Edit Bonus</span>
                  <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                    Even F-rated edits can earn <span className="text-amber-400 font-bold">$50</span> if they go viral. Hit <span className="text-foreground font-bold">100k+ views</span> on any platform and the Jackpot Edit bonus unlocks automatically. Post well, promote hard.
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[8px] text-white/15 uppercase tracking-[0.2em]">Score 90+ QOI for S-Class payouts</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Edit Modal */}
      <AnimatePresence>
        {showSubmitModal && canSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.97 }}
              className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-400" /> {mySubmissions.length > 0 ? 'Submit Another Edit' : 'Submit Your Edit'}
                </h3>
                <button onClick={() => setShowSubmitModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <SubmitForm onSubmit={async (url, platform, message) => { await submitEdit({ submission_url: url, platform, message: message || undefined }); setShowSubmitModal(false); }}
                disabled={false} userId={user?.id} previousSubmissions={mySubmissions.length} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
