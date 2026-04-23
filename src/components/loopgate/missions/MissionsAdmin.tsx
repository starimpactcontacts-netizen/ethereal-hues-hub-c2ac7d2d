import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Pencil, Trash2, Play, Pause, Loader2, X,
  Check, ExternalLink, ChevronDown, ChevronUp, Eye, Wallet, Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────
interface Milestone {
  views: number;
  bonus_cents: number;
}

interface Mission {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  reference_video_url: string | null;
  base_payout_cents: number;
  view_milestones: Milestone[];
  budget_cents: number;
  spent_cents: number;
  status: 'draft' | 'live' | 'paused' | 'closed';
  deadline: string | null;
  submission_count: number;
  approved_count: number;
  total_views: number;
  created_at: string;
}

interface MissionSub {
  id: string;
  mission_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  video_url: string;
  platform: string | null;
  thumbnail_url: string | null;
  title: string | null;
  posted_handle: string | null;
  view_count: number;
  base_earned_cents: number;
  bonus_earned_cents: number;
  total_earned_cents: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  feedback: string | null;
  created_at: string;
}

interface Payout {
  id: string;
  user_id: string;
  amount_cents: number;
  method: string;
  destination: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  username?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-zinc-400 bg-zinc-800',
  live: 'text-emerald-400 bg-emerald-950',
  paused: 'text-amber-400 bg-amber-950',
  closed: 'text-zinc-500 bg-zinc-900',
};

// ─── Component ────────────────────────────────────────────────────────
export default function MissionsAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'missions' | 'submissions' | 'payouts'>('missions');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [subs, setSubs] = useState<MissionSub[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLauncher, setShowLauncher] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [mRes, sRes, pRes] = await Promise.all([
      supabase.from('missions').select('*').order('created_at', { ascending: false }),
      supabase.from('mission_submissions').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('mission_payouts').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    setMissions((mRes.data as any) || []);
    setSubs((sRes.data as any) || []);

    // Hydrate payout usernames
    const userIds = [...new Set((pRes.data || []).map((p: any) => p.user_id))];
    let usernameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, username').in('id', userIds);
      (profs || []).forEach((p: any) => { usernameMap[p.id] = p.username; });
    }
    setPayouts(((pRes.data as any) || []).map((p: any) => ({ ...p, username: usernameMap[p.user_id] || null })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Mission actions ────────────────────────────────────────────────
  const setStatus = async (m: Mission, status: Mission['status']) => {
    const { error } = await supabase.from('missions').update({ status }).eq('id', m.id);
    if (error) return toast.error(error.message);
    toast.success(`${m.title} → ${status}`);
    setMissions(prev => prev.map(x => x.id === m.id ? { ...x, status } : x));
  };

  const deleteMission = async (m: Mission) => {
    if (!confirm(`Delete mission "${m.title}"? All submissions tied to it will be removed.`)) return;
    const { error } = await supabase.from('missions').delete().eq('id', m.id);
    if (error) return toast.error(error.message);
    toast.success('Mission deleted');
    fetchAll();
  };

  // ─── Submission review ──────────────────────────────────────────────
  const computeBonus = (views: number, milestones: Milestone[]) => {
    return milestones
      .filter(m => views >= m.views)
      .reduce((sum, m) => sum + (m.bonus_cents || 0), 0);
  };

  const reviewSub = async (sub: MissionSub, action: 'approved' | 'rejected', feedback?: string) => {
    const mission = missions.find(m => m.id === sub.mission_id);
    if (!mission) return toast.error('Mission not found');

    let base = 0, bonus = 0;
    if (action === 'approved') {
      base = mission.base_payout_cents;
      bonus = computeBonus(sub.view_count || 0, mission.view_milestones || []);
    }

    const { error } = await supabase.from('mission_submissions').update({
      status: action,
      base_earned_cents: base,
      bonus_earned_cents: bonus,
      feedback: feedback ?? sub.feedback,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
    }).eq('id', sub.id);
    if (error) return toast.error(error.message);

    if (action === 'approved' && (base + bonus) > 0) {
      // Bump mission spent + approved counts
      await supabase.from('missions').update({
        spent_cents: (mission.spent_cents || 0) + base + bonus,
        approved_count: (mission.approved_count || 0) + 1,
      }).eq('id', mission.id);
    }

    toast.success(`Submission ${action}`);
    fetchAll();
  };

  const recalcPayout = async (sub: MissionSub) => {
    const mission = missions.find(m => m.id === sub.mission_id);
    if (!mission) return toast.error('Mission not found');
    const bonus = computeBonus(sub.view_count || 0, mission.view_milestones || []);
    const newTotal = mission.base_payout_cents + bonus;
    const oldTotal = sub.total_earned_cents || 0;

    const { error } = await supabase.from('mission_submissions').update({
      base_earned_cents: mission.base_payout_cents,
      bonus_earned_cents: bonus,
    }).eq('id', sub.id);
    if (error) return toast.error(error.message);

    // Adjust mission spent
    const delta = newTotal - oldTotal;
    if (delta !== 0) {
      await supabase.from('missions').update({
        spent_cents: Math.max(0, (mission.spent_cents || 0) + delta),
      }).eq('id', mission.id);
    }
    toast.success(`Recalculated → $${(newTotal / 100).toFixed(2)}`);
    fetchAll();
  };

  // ─── Payout actions ─────────────────────────────────────────────────
  const updatePayout = async (p: Payout, status: Payout['status']) => {
    const { error } = await supabase.from('mission_payouts').update({
      status,
      processed_by: user?.id ?? null,
      processed_at: status === 'paid' || status === 'rejected' ? new Date().toISOString() : null,
    }).eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(`Payout → ${status}`);
    fetchAll();
  };

  // ─── Render ─────────────────────────────────────────────────────────
  const pendingSubs = subs.filter(s => s.status === 'pending').length;
  const pendingPayouts = payouts.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Missions Admin
          </h2>
        </div>
        <Button onClick={() => { setEditing(null); setShowLauncher(true); }} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Launch Mission
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-lg w-full sm:w-fit">
        {[
          { id: 'missions' as const, label: `Missions (${missions.length})` },
          { id: 'submissions' as const, label: `Submissions${pendingSubs ? ` · ${pendingSubs}` : ''}` },
          { id: 'payouts' as const, label: `Payouts${pendingPayouts ? ` · ${pendingPayouts}` : ''}` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === t.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>}

      {/* MISSIONS TAB */}
      {!loading && tab === 'missions' && (
        <div className="space-y-2">
          {missions.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-sm">
              No missions yet. Launch your first paid mission.
            </div>
          )}
          {missions.map(m => {
            const isOpen = expanded === m.id;
            const missionSubs = subs.filter(s => s.mission_id === m.id);
            return (
              <div key={m.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-zinc-800 overflow-hidden flex-shrink-0">
                    {m.cover_image_url
                      ? <img src={m.cover_image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-zinc-600"><DollarSign className="w-5 h-5" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{m.title}</h3>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[m.status]}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>${(m.base_payout_cents / 100).toFixed(2)} base</span>
                      <span>+ {(m.view_milestones || []).length} milestones</span>
                      <span>{m.submission_count} clips</span>
                      <span>${(m.spent_cents / 100).toFixed(2)} / ${(m.budget_cents / 100).toFixed(2)} budget</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.status === 'draft' && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(m, 'live')} title="Go live">
                        <Play className="w-4 h-4 text-emerald-400" />
                      </Button>
                    )}
                    {m.status === 'live' && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(m, 'paused')} title="Pause">
                        <Pause className="w-4 h-4 text-amber-400" />
                      </Button>
                    )}
                    {m.status === 'paused' && (
                      <Button size="sm" variant="ghost" onClick={() => setStatus(m, 'live')} title="Resume">
                        <Play className="w-4 h-4 text-emerald-400" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setShowLauncher(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMission(m)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : m.id)}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-zinc-800 bg-zinc-950 p-3 space-y-2">
                    <div className="text-[11px] text-zinc-400">
                      {m.description || 'No description'}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      <strong className="text-zinc-300">Milestones:</strong>{' '}
                      {(m.view_milestones || []).length === 0
                        ? 'None'
                        : (m.view_milestones || []).map((ms, i) => (
                            <span key={i} className="inline-block mr-2">
                              {ms.views.toLocaleString()}v → +${(ms.bonus_cents / 100).toFixed(2)}
                            </span>
                          ))}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      <strong className="text-zinc-300">Submissions:</strong> {missionSubs.length} total ·{' '}
                      {missionSubs.filter(s => s.status === 'pending').length} pending ·{' '}
                      {missionSubs.filter(s => s.status === 'approved').length} approved
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {!loading && tab === 'submissions' && (
        <SubmissionsList
          subs={subs}
          missions={missions}
          onReview={reviewSub}
          onRecalc={recalcPayout}
        />
      )}

      {/* PAYOUTS TAB */}
      {!loading && tab === 'payouts' && (
        <PayoutsList payouts={payouts} onUpdate={updatePayout} />
      )}

      {/* LAUNCHER MODAL */}
      {showLauncher && (
        <MissionLauncher
          mission={editing}
          userId={user?.id}
          onClose={() => { setShowLauncher(false); setEditing(null); }}
          onSaved={() => { setShowLauncher(false); setEditing(null); fetchAll(); }}
        />
      )}
    </div>
  );
}

// ═══ Submissions list ═══════════════════════════════════════════════════
function SubmissionsList({
  subs, missions, onReview, onRecalc,
}: {
  subs: MissionSub[];
  missions: Mission[];
  onReview: (s: MissionSub, action: 'approved' | 'rejected', feedback?: string) => void;
  onRecalc: (s: MissionSub) => void;
}) {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[11px] rounded uppercase font-semibold ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {f} ({f === 'all' ? subs.length : subs.filter(s => s.status === f).length})
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-8 text-zinc-500 text-xs">No submissions</div>}
      {filtered.map(s => {
        const m = missions.find(x => x.id === s.mission_id);
        return (
          <div key={s.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold text-white">@{s.username || s.user_id.slice(0, 8)}</span>
                  <span className="text-[10px] text-zinc-500">→ {m?.title || 'Unknown mission'}</span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                    s.status === 'approved' ? 'bg-emerald-950 text-emerald-400'
                    : s.status === 'rejected' ? 'bg-red-950 text-red-400'
                    : s.status === 'paid' ? 'bg-blue-950 text-blue-400'
                    : 'bg-amber-950 text-amber-400'
                  }`}>{s.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <a href={s.video_url} target="_blank" rel="noreferrer" className="hover:text-white inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {s.platform || 'video'}
                  </a>
                  <span><Eye className="w-3 h-3 inline mr-0.5" /> {(s.view_count || 0).toLocaleString()}</span>
                  <span className="text-emerald-400 font-semibold">
                    ${(s.total_earned_cents / 100).toFixed(2)}
                  </span>
                </div>
                {s.feedback && <div className="text-[10px] text-zinc-500 mt-1 italic">"{s.feedback}"</div>}
              </div>
              <div className="flex flex-col gap-1">
                {s.status === 'pending' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => onReview(s, 'approved')} className="h-7 px-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onReview(s, 'rejected')} className="h-7 px-2">
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </>
                )}
                {s.status === 'approved' && (
                  <Button size="sm" variant="ghost" onClick={() => onRecalc(s)} className="h-7 px-2 text-[10px]" title="Recalc with current views">
                    Recalc
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══ Payouts list ═══════════════════════════════════════════════════════
function PayoutsList({ payouts, onUpdate }: { payouts: Payout[]; onUpdate: (p: Payout, s: Payout['status']) => void }) {
  const [filter, setFilter] = useState<'pending' | 'processing' | 'paid' | 'all'>('pending');
  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.status === filter);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {(['pending', 'processing', 'paid', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[11px] rounded uppercase font-semibold ${
              filter === f ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            {f} ({f === 'all' ? payouts.length : payouts.filter(p => p.status === f).length})
          </button>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-8 text-zinc-500 text-xs">No payouts</div>}
      {filtered.map(p => (
        <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Wallet className="w-4 h-4 text-emerald-400 mt-1" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-emerald-400">${(p.amount_cents / 100).toFixed(2)}</span>
                <span className="text-xs text-white">@{p.username || p.user_id.slice(0, 8)}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-bold bg-zinc-800 text-zinc-300">
                  {p.method}
                </span>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  p.status === 'paid' ? 'bg-emerald-950 text-emerald-400'
                  : p.status === 'rejected' ? 'bg-red-950 text-red-400'
                  : p.status === 'processing' ? 'bg-blue-950 text-blue-400'
                  : 'bg-amber-950 text-amber-400'
                }`}>{p.status}</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 break-all font-mono">{p.destination}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">
                Requested {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {p.status === 'pending' && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate(p, 'processing')} className="h-7 px-2 text-[10px]">
                    <Send className="w-3 h-3 mr-1" /> Process
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate(p, 'rejected')} className="h-7 px-2">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </>
              )}
              {p.status === 'processing' && (
                <Button size="sm" variant="ghost" onClick={() => onUpdate(p, 'paid')} className="h-7 px-2 text-[10px]">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> Mark Paid
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══ Mission Launcher Modal ════════════════════════════════════════════
function MissionLauncher({
  mission, userId, onClose, onSaved,
}: {
  mission: Mission | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(mission?.title || '');
  const [description, setDescription] = useState(mission?.description || '');
  const [coverUrl, setCoverUrl] = useState(mission?.cover_image_url || '');
  const [sponsorName, setSponsorName] = useState(mission?.sponsor_name || '');
  const [sponsorLogo, setSponsorLogo] = useState(mission?.sponsor_logo_url || '');
  const [refUrl, setRefUrl] = useState(mission?.reference_video_url || '');
  const [basePayout, setBasePayout] = useState(((mission?.base_payout_cents || 0) / 100).toString());
  const [budget, setBudget] = useState(((mission?.budget_cents || 0) / 100).toString());
  const [milestones, setMilestones] = useState<Milestone[]>(
    mission?.view_milestones || [
      { views: 10000, bonus_cents: 1000 },
      { views: 50000, bonus_cents: 2500 },
      { views: 100000, bonus_cents: 10000 },
    ],
  );
  const [deadline, setDeadline] = useState(mission?.deadline ? mission.deadline.slice(0, 16) : '');
  const [saving, setSaving] = useState(false);

  const updateMs = (i: number, key: keyof Milestone, value: string) => {
    const v = parseFloat(value) || 0;
    setMilestones(prev => prev.map((ms, idx) => idx === i ? {
      ...ms,
      [key]: key === 'bonus_cents' ? Math.round(v * 100) : Math.round(v),
    } : ms));
  };

  const addMs = () => setMilestones(prev => [...prev, { views: 0, bonus_cents: 0 }]);
  const removeMs = (i: number) => setMilestones(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!title.trim()) return toast.error('Title required');
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      cover_image_url: coverUrl.trim() || null,
      sponsor_name: sponsorName.trim() || null,
      sponsor_logo_url: sponsorLogo.trim() || null,
      reference_video_url: refUrl.trim() || null,
      base_payout_cents: Math.round((parseFloat(basePayout) || 0) * 100),
      budget_cents: Math.round((parseFloat(budget) || 0) * 100),
      view_milestones: milestones.filter(m => m.views > 0).sort((a, b) => a.views - b.views),
      deadline: deadline ? new Date(deadline).toISOString() : null,
    };
    let error;
    if (mission) {
      ({ error } = await supabase.from('missions').update(payload).eq('id', mission.id));
    } else {
      ({ error } = await supabase.from('missions').insert({ ...payload, status: 'draft', created_by: userId ?? null }));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(mission ? 'Mission updated' : 'Mission created');
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mission ? 'Edit Mission' : 'Launch New Mission'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-zinc-400">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Promote Single 'Midnight Run'" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What clippers should make…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Cover image URL</Label>
              <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Reference video URL</Label>
              <Input value={refUrl} onChange={e => setRefUrl(e.target.value)} placeholder="https://youtube.com/…" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Sponsor name</Label>
              <Input value={sponsorName} onChange={e => setSponsorName(e.target.value)} placeholder="Loopgate" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Sponsor logo URL</Label>
              <Input value={sponsorLogo} onChange={e => setSponsorLogo(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-zinc-400">Base payout per approved clip ($)</Label>
              <Input type="number" step="0.01" value={basePayout} onChange={e => setBasePayout(e.target.value)} placeholder="5.00" />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Total budget cap ($)</Label>
              <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} placeholder="500.00" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-zinc-400">View milestones (cumulative bonuses)</Label>
              <Button size="sm" variant="ghost" onClick={addMs} className="h-6 px-2 text-[10px]">
                <Plus className="w-3 h-3 mr-1" /> Add tier
              </Button>
            </div>
            <div className="space-y-1.5">
              {milestones.map((ms, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={ms.views || ''}
                    onChange={e => updateMs(i, 'views', e.target.value)}
                    placeholder="Views"
                    className="flex-1"
                  />
                  <span className="text-zinc-500 text-xs">→ +$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={ms.bonus_cents ? (ms.bonus_cents / 100).toString() : ''}
                    onChange={e => updateMs(i, 'bonus_cents', e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={() => removeMs(i)} className="h-8 px-2">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              {milestones.length === 0 && (
                <div className="text-[11px] text-zinc-600 italic">No milestones — clippers earn only base pay.</div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-400">Deadline (optional)</Label>
            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : mission ? 'Save changes' : 'Create as draft'}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
          {!mission && (
            <p className="text-[10px] text-zinc-500 text-center">
              Mission will be created as draft. Use the ▶ play icon to push it live.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}