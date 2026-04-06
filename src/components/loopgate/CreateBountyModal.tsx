import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ImagePlus, X, Loader2, Send, AlertTriangle, ChevronDown, Music, Film, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { SubmissionRating } from '@/hooks/useCommissions';
import type { MissionType } from '@/hooks/useBountyMarketplace';

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];
const PLATFORM_FEE = 0.10;

const MISSION_TYPES: { value: MissionType; label: string; icon: typeof Music; color: string; desc: string }[] = [
  { value: 'artist', label: 'Artist', icon: Music, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', desc: 'Music artist needs edits for their song/album' },
  { value: 'brand', label: 'Brand', icon: Briefcase, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', desc: 'Brand wants promotional content edited' },
  { value: 'film', label: 'Film', icon: Film, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', desc: 'Film/studio needs trailer or promo edits' },
  { value: 'standard', label: 'Personal', icon: User, color: 'text-foreground border-border/50 bg-surface-1', desc: 'Personal bounty from a community member' },
];

interface CreateBountyModalProps {
  onClose: () => void;
  onCreate: (params: any) => Promise<any>;
  defaultType?: MissionType;
}

export default function CreateBountyModal({ onClose, onCreate, defaultType }: CreateBountyModalProps) {
  const { user } = useAuth();
  const [missionType, setMissionType] = useState<MissionType>(defaultType || 'standard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [clientName, setClientName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [songName, setSongName] = useState('');
  const [referenceVideoUrl, setReferenceVideoUrl] = useState('');
  const [payoutDollars, setPayoutDollars] = useState('');
  const [maxSlots, setMaxSlots] = useState('3');
  const [deadline, setDeadline] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useCustomPayouts, setUseCustomPayouts] = useState(false);
  const [customPayouts, setCustomPayouts] = useState<Record<SubmissionRating, string>>({
    S: '5', A: '3', B: '1', C: '0', D: '0', F: '0'
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const payoutCents = Math.round(parseFloat(payoutDollars || '0') * 100);
  const feeCents = Math.round(payoutCents * PLATFORM_FEE);
  const totalCost = payoutCents + feeCents;

  const typeConfig = MISSION_TYPES.find(t => t.value === missionType)!;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Cover must be under 10MB'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('bounty-covers').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('bounty-covers').getPublicUrl(path);
      setCoverUrl(urlData.publicUrl);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!title.trim() || payoutCents < 500) return;
    setSubmitting(true);
    try {
      const params: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        artist_name: artistName.trim() || undefined,
        song_name: songName.trim() || undefined,
        payout_cents: payoutCents,
        max_slots: parseInt(maxSlots) || 3,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        cover_url: coverUrl || undefined,
        mission_type: missionType,
        client_name: clientName.trim() || undefined,
        reference_video_url: referenceVideoUrl.trim() || undefined,
      };

      if (useCustomPayouts) {
        const payoutsInCents: Record<string, number> = {};
        for (const r of RATINGS) {
          payoutsInCents[r] = Math.round(parseFloat(customPayouts[r] || '0') * 100);
        }
        params.custom_payouts = payoutsInCents;
      }

      await onCreate(params);
      toast.success('Mission posted!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create mission');
    }
    setSubmitting(false);
  };

  const showArtistFields = missionType === 'artist' || missionType === 'standard';
  const showClientField = missionType === 'brand' || missionType === 'film';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain"
        onClick={e => e.stopPropagation()}>
        
        <div className="sticky top-0 bg-card border-b border-border/50 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Post a Mission
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        <div className="p-4 pb-24 space-y-4">
          {/* Mission Type Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Mission Type *</label>
            <div className="grid grid-cols-4 gap-2">
              {MISSION_TYPES.map(t => {
                const Icon = t.icon;
                const isSelected = missionType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setMissionType(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 border rounded-lg transition-all ${
                      isSelected ? t.color + ' ring-1 ring-current' : 'border-border/30 bg-surface-1 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{typeConfig.desc}</p>
          </div>

          {/* Client name for brand/film */}
          {showClientField && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                {missionType === 'brand' ? 'Brand Name' : 'Studio / Production'} *
              </label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder={missionType === 'brand' ? 'e.g. Nike, Red Bull' : 'e.g. A24, Paramount'} />
            </div>
          )}

          {/* Cover upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Cover Image</label>
            {coverUrl ? (
              <div className="relative">
                <img src={coverUrl} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => setCoverUrl(null)} className="absolute top-2 right-2 w-6 h-6 bg-background/80 border border-border rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Upload cover</span>
                  </>
                )}
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={
              missionType === 'artist' ? 'e.g. Need a fire edit for my track' :
              missionType === 'brand' ? 'e.g. Summer campaign promo edit' :
              missionType === 'film' ? 'e.g. Trailer re-cut for social media' :
              'e.g. Edit my gaming montage'
            } />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Brief / Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What vibe are you looking for? Style references, mood, etc." className="min-h-[80px] resize-none" />
          </div>

          {/* Requirements */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Requirements</label>
            <Textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Platform to post on, min duration, specific effects..." className="min-h-[60px] resize-none" />
          </div>

          {/* Artist / Song (for artist type) */}
          {showArtistFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Artist</label>
                <Input value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Artist name" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Song</label>
                <Input value={songName} onChange={e => setSongName(e.target.value)} placeholder="Song name" />
              </div>
            </div>
          )}

          {/* Reference video URL */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Reference / Inspo Link</label>
            <Input value={referenceVideoUrl} onChange={e => setReferenceVideoUrl(e.target.value)} placeholder="YouTube, TikTok, or Instagram URL" />
          </div>

          {/* Payout / Slots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Payout ($) *</label>
              <Input type="number" value={payoutDollars} onChange={e => setPayoutDollars(e.target.value)} placeholder="5" min="5" />
              <p className="text-[9px] text-muted-foreground mt-1">Min $5 · Editors receive this amount</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Max Accepts</label>
              <Input type="number" value={maxSlots} onChange={e => setMaxSlots(e.target.value)} placeholder="3" min="1" max="50" />
            </div>
          </div>

          {/* Fee breakdown */}
          {payoutCents > 0 && (
            <div className="bg-surface-1 border border-border/30 p-3 rounded-lg space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Editor payout</span>
                <span className="text-emerald-400 font-bold">${(payoutCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Platform fee (10%)</span>
                <span className="text-amber-400 font-bold">${(feeCents / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-border/30 pt-1.5 flex justify-between text-[12px]">
                <span className="text-foreground font-bold">Total cost</span>
                <span className="text-foreground font-bold">${(totalCost / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Custom payouts toggle */}
          <div>
            <button
              onClick={() => setUseCustomPayouts(!useCustomPayouts)}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${useCustomPayouts ? 'rotate-180' : ''}`} />
              Custom Payout Tiers (optional)
            </button>
            <AnimatePresence>
              {useCustomPayouts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-3 gap-2 mt-2"
                >
                  {RATINGS.map(r => (
                    <div key={r} className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-foreground w-4">{r}</span>
                      <Input
                        type="number"
                        value={customPayouts[r]}
                        onChange={e => setCustomPayouts(prev => ({ ...prev, [r]: e.target.value }))}
                        className="h-8 text-xs"
                        min="0"
                        placeholder="$"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Deadline (optional)</label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          {/* Honor system note */}
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-400/70">
              Missions are honor-system. Loopgate takes a 10% platform fee. Editors can rate mission posters.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            disabled={submitting || !title.trim() || payoutCents < 500 || (showClientField && !clientName.trim())}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Post Mission — ${(totalCost / 100).toFixed(2)}</>}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
