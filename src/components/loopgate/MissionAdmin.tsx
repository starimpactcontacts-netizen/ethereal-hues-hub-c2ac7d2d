import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, ToggleLeft, ToggleRight, Pencil, ExternalLink,
  Loader2, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RATING_COLORS, type SubmissionRating } from '@/hooks/useCommissions';

const RATINGS: SubmissionRating[] = ['S', 'A', 'B', 'C', 'D', 'F'];

interface MissionDrop {
  id: string;
  title: string;
  song_name: string;
  poster_url: string | null;
  artist_name: string | null;
  status: string;
  mission_live: boolean;
  mission_custom_payouts: Record<string, number> | null;
  mission_views_milestone: number;
  mission_views_bonus_cents: number;
  instant_payout: boolean;
  inspo_url: string | null;
  inspo_thumbnail_url: string | null;
  theme_description: string | null;
  submission_count: number;
}

interface MissionSub {
  id: string;
  drop_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string | null;
  status: string | null;
  rating: string | null;
  earned_cents: number;
  feedback: string | null;
  created_at: string;
}

export default function MissionAdmin() {
  const [missions, setMissions] = useState<MissionDrop[]>([]);
  const [subs, setSubs] = useState<MissionSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingMission, setEditingMission] = useState<MissionDrop | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ sub: MissionSub; mission: MissionDrop } | null>(null);

  const fetchAll = useCallback(async () => {
    const [mRes, sRes] = await Promise.all([
      supabase.from('featured_drops')
        .select('id, title, song_name, poster_url, status, mission_live, mission_custom_payouts, mission_views_milestone, mission_views_bonus_cents, instant_payout, inspo_url, inspo_thumbnail_url, theme_description, submission_count, featured_artists(name)')
        .order('created_at', { ascending: false }),
      supabase.from('featured_submissions')
        .select('id, drop_id, user_id, username, avatar_url, submission_url, platform, status, rating, earned_cents, feedback, created_at')
        .order('created_at', { ascending: false }).limit(500),
    ]);
    if (mRes.data) {
      setMissions(mRes.data.map((d: any) => ({
        id: d.id, title: d.title, song_name: d.song_name, poster_url: d.poster_url,
        artist_name: d.featured_artists?.name || null, status: d.status || 'draft',
        mission_live: d.mission_live ?? false,
        mission_custom_payouts: d.mission_custom_payouts as Record<string, number> | null,
        mission_views_milestone: d.mission_views_milestone || 0,
        mission_views_bonus_cents: d.mission_views_bonus_cents || 0,
        instant_payout: d.instant_payout ?? false,
        inspo_url: d.inspo_url || null, inspo_thumbnail_url: d.inspo_thumbnail_url || null,
        theme_description: d.theme_description || null, submission_count: d.submission_count || 0,
      })));
    }
    if (sRes.data) setSubs(sRes.data as any as MissionSub[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleLive = async (m: MissionDrop) => {
    const v = !m.mission_live;
    await supabase.from('featured_drops').update({ mission_live: v } as any).eq('id', m.id);
    setMissions(p => p.map(x => x.id === m.id ? { ...x, mission_live: v } : x));
    toast.success(v ? `${m.song_name} is LIVE` : `${m.song_name} removed`);
  };

  const toggleInstant = async (m: MissionDrop) => {
    const v = !m.instant_payout;
    await supabase.from('featured_drops').update({ instant_payout: v } as any).eq('id', m.id);
    setMissions(p => p.map(x => x.id === m.id ? { ...x, instant_payout: v } : x));
    toast.success(v ? 'Instant payout ON' : 'Instant payout OFF');
  };

  const live = missions.filter(m => m.mission_live);
  const off = missions.filter(m => !m.mission_live);

  if (loading) return <div className="text-xs text-muted-foreground py-4">Loading missions...</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <DollarSign size={14} className="text-emerald-400" />
          Live Mission Control
        </h2>
        <span className="text-xs text-emerald-400 font-bold">{live.length} live</span>
      </div>

      {live.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">🟢 LIVE</span>
          {live.map(m => {
            const mSubs = subs.filter(s => s.drop_id === m.id);
            return (
              <MissionRow key={m.id} m={m} subs={mSubs} expanded={expanded === m.id}
                onToggleExpand={() => setExpanded(expanded === m.id ? null : m.id)}
                onToggleLive={() => toggleLive(m)} onToggleInstant={() => toggleInstant(m)}
                onEdit={() => setEditingMission(m)} onRate={(sub) => setRatingTarget({ sub, mission: m })}
              />
            );
          })}
        </div>
      )}

      {off.length > 0 && (
        <details className="mt-3">
          <summary className="text-[9px] uppercase tracking-wider text-muted-foreground cursor-pointer font-bold mb-2">
            {off.length} songs available to push live
          </summary>
          <div className="space-y-2">
            {off.map(m => {
              const mSubs = subs.filter(s => s.drop_id === m.id);
              return (
                <MissionRow key={m.id} m={m} subs={mSubs} expanded={expanded === m.id}
                  onToggleExpand={() => setExpanded(expanded === m.id ? null : m.id)}
                  onToggleLive={() => toggleLive(m)} onToggleInstant={() => toggleInstant(m)}
                  onEdit={() => setEditingMission(m)} onRate={(sub) => setRatingTarget({ sub, mission: m })}
                />
              );
            })}
          </div>
        </details>
      )}

      {editingMission && (
        <MissionEditDialog mission={editingMission} onClose={() => setEditingMission(null)} onSaved={() => { setEditingMission(null); fetchAll(); }} />
      )}

      {ratingTarget && (
        <MissionRatingModal
          submission={ratingTarget.sub}
          payoutMap={ratingTarget.mission.mission_custom_payouts}
          onClose={() => setRatingTarget(null)}
          onRated={() => { setRatingTarget(null); fetchAll(); }}
        />
      )}
    </section>
  );
}

/* ─── Mission Row ─── */
function MissionRow({ m, subs, expanded, onToggleExpand, onToggleLive, onToggleInstant, onEdit, onRate }: {
  m: MissionDrop; subs: MissionSub[]; expanded: boolean;
  onToggleExpand: () => void; onToggleLive: () => void; onToggleInstant: () => void;
  onEdit: () => void; onRate: (s: MissionSub) => void;
}) {
  const pending = subs.filter(s => s.status === 'pending');
  const payouts = m.mission_custom_payouts || {};
  const hasPricing = Object.values(payouts).some(v => v > 0);

  return (
    <div className={`border rounded-lg overflow-hidden ${m.mission_live ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-surface-1'}`}>
      <div className="p-3">
        <div className="flex items-center gap-3">
          {m.poster_url && <img src={m.poster_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold truncate">{m.song_name}</span>
              {m.instant_payout && (
                <span className="text-[7px] font-black bg-red-500 text-white px-1 py-0.5 rounded uppercase leading-none">⚡ INSTANT</span>
              )}
              {!hasPricing && m.mission_live && (
                <span className="text-[7px] font-black bg-amber-500 text-black px-1 py-0.5 rounded uppercase leading-none">⚠ NO PRICES</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {m.artist_name || 'Unknown'} · {subs.length} subs ({pending.length} pending)
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onToggleLive} className={`p-1.5 rounded ${m.mission_live ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/30 text-muted-foreground'}`}
              title={m.mission_live ? 'Take offline' : 'Push live'}>
              {m.mission_live ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
            <button onClick={onEdit} className="p-1.5 rounded text-purple-400 hover:bg-purple-500/10" title="Edit settings">
              <Pencil size={14} />
            </button>
            <button onClick={onToggleExpand} className="p-1.5 rounded bg-surface-2">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
        {hasPricing && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {RATINGS.map(r => {
              const p = payouts[r] || 0;
              return (
                <span key={r} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${RATING_COLORS[r]}`}>
                  {r}{p > 0 ? `=$${(p / 100).toFixed(0)}` : '=IDX'}
                </span>
              );
            })}
            {m.mission_views_milestone > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
                {(m.mission_views_milestone / 1000).toFixed(0)}K = +${(m.mission_views_bonus_cents / 100).toFixed(0)}
              </span>
            )}
          </div>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border p-3 space-y-2">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Submissions ({subs.length})</h4>
          {subs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No submissions yet</p>
          ) : subs.map(sub => (
            <div key={sub.id} className="space-y-1">
              <div className={`flex items-center justify-between p-2 rounded-lg border ${sub.rating ? 'bg-surface-1 border-border' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {sub.avatar_url ? <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold">{sub.username?.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold truncate block">@{sub.username}</span>
                    <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5">
                      <ExternalLink size={8} /> Watch
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sub.rating ? (
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-black px-1.5 py-0.5 rounded border ${RATING_COLORS[sub.rating as SubmissionRating]}`}>{sub.rating}</span>
                      {sub.earned_cents > 0 && <span className="text-emerald-400 font-bold text-[10px]">+${(sub.earned_cents / 100).toFixed(2)}</span>}
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onRate(sub)} className="text-[10px] h-7 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                      <Star className="w-3 h-3 mr-1" /> Rate
                    </Button>
                  )}
                </div>
              </div>
              {sub.feedback && <p className="text-[9px] text-muted-foreground italic ml-8">"{sub.feedback}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Edit Dialog ─── */
function MissionEditDialog({ mission, onClose, onSaved }: { mission: MissionDrop; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    mission_custom_payouts: mission.mission_custom_payouts || { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 } as Record<string, number>,
    mission_views_milestone: mission.mission_views_milestone,
    mission_views_bonus_cents: mission.mission_views_bonus_cents,
    instant_payout: mission.instant_payout,
    inspo_url: mission.inspo_url || '',
    inspo_thumbnail_url: mission.inspo_thumbnail_url || '',
    theme_description: mission.theme_description || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('featured_drops').update({
      mission_custom_payouts: form.mission_custom_payouts,
      mission_views_milestone: form.mission_views_milestone,
      mission_views_bonus_cents: form.mission_views_bonus_cents,
      instant_payout: form.instant_payout,
      inspo_url: form.inspo_url || null,
      inspo_thumbnail_url: form.inspo_thumbnail_url || null,
      theme_description: form.theme_description || null,
    } as any).eq('id', mission.id);
    if (error) toast.error(error.message);
    else { toast.success('Mission settings saved!'); onSaved(); }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <DollarSign size={18} className="text-emerald-400" /> Mission — {mission.song_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs text-emerald-400 font-bold">Payout per Rating (cents)</Label>
            <p className="text-[9px] text-muted-foreground mb-2">1000 = $10, 500 = $5</p>
            <div className="grid grid-cols-3 gap-2">
              {RATINGS.map(r => (
                <div key={r} className="flex items-center gap-1.5">
                  <span className={`text-xs font-black w-4 ${r === 'S' ? 'text-amber-400' : r === 'A' ? 'text-emerald-400' : r === 'B' ? 'text-blue-400' : 'text-muted-foreground'}`}>{r}</span>
                  <Input type="number" value={form.mission_custom_payouts[r] || 0}
                    onChange={e => setForm({ ...form, mission_custom_payouts: { ...form.mission_custom_payouts, [r]: Number(e.target.value) } })}
                    className="h-8 text-xs" />
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-amber-400">Views Milestone</Label>
              <Input type="number" value={form.mission_views_milestone} onChange={e => setForm({ ...form, mission_views_milestone: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs text-amber-400">Views Bonus (cents)</Label>
              <Input type="number" value={form.mission_views_bonus_cents} onChange={e => setForm({ ...form, mission_views_bonus_cents: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <label className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg cursor-pointer">
            <div>
              <span className="text-xs font-bold text-red-400">⚡ Instant Payout</span>
              <p className="text-[9px] text-muted-foreground">Paid within 24-48h. Red badge on card.</p>
            </div>
            <input type="checkbox" checked={form.instant_payout} onChange={e => setForm({ ...form, instant_payout: e.target.checked })} className="w-4 h-4 accent-red-500" />
          </label>
          <div className="border-t border-border pt-3">
            <Label className="text-xs font-bold text-purple-400">🎨 Theme & Inspo for Editors</Label>
            <p className="text-[9px] text-muted-foreground mb-2">Editors see this when they open this mission</p>
            <div className="space-y-2">
              <div>
                <Label className="text-[10px]">Theme Description</Label>
                <Textarea value={form.theme_description} onChange={e => setForm({ ...form, theme_description: e.target.value })}
                  placeholder="Dark moody edit with glitch transitions..." className="mt-1 text-xs" rows={3} />
              </div>
              <div>
                <Label className="text-[10px]">Inspo Video URL</Label>
                <Input value={form.inspo_url} onChange={e => setForm({ ...form, inspo_url: e.target.value })}
                  placeholder="YouTube/TikTok example" className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px]">Inspo Thumbnail</Label>
                <Input value={form.inspo_thumbnail_url} onChange={e => setForm({ ...form, inspo_thumbnail_url: e.target.value })}
                  placeholder="Image URL preview" className="mt-1 h-8 text-xs" />
              </div>
              {form.inspo_thumbnail_url && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <img src={form.inspo_thumbnail_url} alt="Inspo" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Mission Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Rating Modal (mandatory feedback) ─── */
function MissionRatingModal({ submission, payoutMap, onClose, onRated }: {
  submission: MissionSub; payoutMap: Record<string, number> | null; onClose: () => void; onRated: () => void;
}) {
  const [selectedRating, setSelectedRating] = useState<SubmissionRating | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const getPayout = (r: SubmissionRating) => (payoutMap?.[r] ?? 0);

  const handleRate = async () => {
    if (!selectedRating) { toast.error('Pick a rating'); return; }
    if (!feedback.trim()) { toast.error('Feedback is mandatory — editors need to know why'); return; }
    setSubmitting(true);
    const earnedCents = getPayout(selectedRating);
    const { error } = await supabase.from('featured_submissions').update({
      rating: selectedRating, earned_cents: earnedCents,
      status: selectedRating === 'F' ? 'declined' : 'scored',
      feedback: feedback.trim(),
      qoi_score: selectedRating === 'S' ? 90 : selectedRating === 'A' ? 75 : selectedRating === 'B' ? 60 : selectedRating === 'C' ? 45 : selectedRating === 'D' ? 30 : 15,
    } as any).eq('id', submission.id);
    if (error) toast.error(error.message);
    else {
      toast.success(earnedCents > 0 ? `Rated ${selectedRating} — $${(earnedCents / 100).toFixed(2)} → @${submission.username}` : `Rated ${selectedRating}`);
      onRated();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Star size={18} className="text-amber-400" /> Rate @{submission.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <a href={submission.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <ExternalLink size={12} /> Watch Edit
          </a>
          <div className="grid grid-cols-6 gap-1.5">
            {RATINGS.map(r => {
              const payout = getPayout(r);
              const sel = selectedRating === r;
              return (
                <button key={r} onClick={() => setSelectedRating(r)}
                  className={`flex flex-col items-center py-2.5 rounded-lg border-2 transition-all ${sel ? RATING_COLORS[r] + ' ring-2 ring-offset-1 ring-offset-background' : 'border-border/30 bg-surface-1 hover:border-border/60'}`}>
                  <span className={`text-lg font-black ${sel ? '' : 'text-foreground'}`}>{r}</span>
                  {payout > 0 ? <span className="text-[8px] font-bold text-emerald-400">${(payout / 100).toFixed(0)}</span> : <span className="text-[8px] text-muted-foreground">IDX</span>}
                </button>
              );
            })}
          </div>
          {selectedRating && getPayout(selectedRating) > 0 && (
            <p className="text-sm text-emerald-400 font-bold text-center">+${(getPayout(selectedRating) / 100).toFixed(2)} → @{submission.username}</p>
          )}
          <div>
            <Label className="text-xs font-bold text-red-400">Feedback (REQUIRED)</Label>
            <p className="text-[9px] text-muted-foreground mb-1">Tell them why — what to improve or what they nailed</p>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Great transitions but pacing needs work..." className="min-h-[80px] resize-none" />
          </div>
          <Button onClick={handleRate} disabled={submitting || !selectedRating || !feedback.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 text-background font-bold text-base py-5">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Star className="w-4 h-4 mr-2" /> Confirm {selectedRating || '...'}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
