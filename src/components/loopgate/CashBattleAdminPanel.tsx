import { useState, useEffect } from 'react';
import { Check, X, Swords, ExternalLink, DollarSign, Building2, Settings, Download, Save } from 'lucide-react';
import { useAdminCashBattles } from '@/hooks/useCashBattles';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CashBattleAdminPanel() {
  const { applications, battles, loading, updateApplicationStatus, createMatch } = useAdminCashBattles();
  const [matchPrize, setMatchPrize] = useState('25');
  const [matchDuration, setMatchDuration] = useState('24');
  const [selectedFighters, setSelectedFighters] = useState<string[]>([]);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [sponsorCampaignId, setSponsorCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editingBattle, setEditingBattle] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.from('artist_campaigns').select('id, name, logo_url, status').eq('status', 'active').then(({ data }) => {
      setCampaigns(data || []);
    });
  }, []);

  const pending = applications.filter(a => a.status === 'pending');
  const approved = applications.filter(a => a.status === 'approved');

  function toggleFighter(userId: string) {
    setSelectedFighters(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : prev.length < 2 ? [...prev, userId] : prev
    );
  }

  function handleCampaignSelect(campaignId: string) {
    setSponsorCampaignId(campaignId);
    const c = campaigns.find(c => c.id === campaignId);
    if (c) {
      setSponsorName(c.name);
      setSponsorLogoUrl(c.logo_url || '');
    }
  }

  async function handleCreateMatch() {
    if (selectedFighters.length !== 2) return;
    await createMatch(
      selectedFighters[0],
      selectedFighters[1],
      Math.round(parseFloat(matchPrize) * 100),
      parseInt(matchDuration),
      sponsorName ? { name: sponsorName, logo_url: sponsorLogoUrl || undefined, campaign_id: sponsorCampaignId || undefined } : undefined
    );
    setSelectedFighters([]);
    setSponsorName('');
    setSponsorLogoUrl('');
    setSponsorCampaignId('');
  }

  function startEditing(battle: any) {
    setEditingBattle(battle.id);
    setEditFields({
      prize: (battle.prize_cents / 100).toString(),
      scenepack_url: battle.scenepack_url || '',
      sponsor_name: battle.sponsor_name || '',
      admin_notes: battle.admin_notes || '',
    });
  }

  async function saveBattleSettings(battleId: string) {
    const { error } = await supabase.from('cash_battles').update({
      prize_cents: Math.round(parseFloat(editFields.prize || '0') * 100),
      scenepack_url: editFields.scenepack_url || null,
      sponsor_name: editFields.sponsor_name || null,
      admin_notes: editFields.admin_notes || null,
    } as any).eq('id', battleId);
    if (error) toast.error('Failed to save');
    else { toast.success('Battle updated'); setEditingBattle(null); }
  }

  if (loading) return <div className="text-xs text-muted-foreground py-4">Loading cash battle data...</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign size={14} className="text-emerald-400" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cash Battle Applications</h2>
        <span className="text-[10px] text-emerald-400 ml-auto">{pending.length} pending</span>
      </div>

      {/* Pending Applications */}
      {pending.map(app => (
        <div key={app.id} className="bg-surface-1 border border-border p-3 mb-2 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={app.avatar_url || ''} />
              <AvatarFallback className="text-xs">{app.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{app.username}</p>
              <p className="text-[10px] text-muted-foreground truncate">{app.pitch || 'No pitch'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {app.demo_reel_url && (
              <a href={app.demo_reel_url} target="_blank" rel="noopener" className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                <ExternalLink size={8} /> Demo
              </a>
            )}
            {app.tiktok_url && (
              <a href={app.tiktok_url} target="_blank" rel="noopener" className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 flex items-center gap-1">
                TikTok
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateApplicationStatus(app.id, 'approved')} className="flex-1 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded flex items-center justify-center gap-1">
              <Check size={12} /> Approve
            </button>
            <button onClick={() => updateApplicationStatus(app.id, 'rejected')} className="flex-1 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold rounded flex items-center justify-center gap-1">
              <X size={12} /> Reject
            </button>
          </div>
        </div>
      ))}

      {/* Matchmaking */}
      {approved.length >= 2 && (
        <div className="border border-emerald-500/20 rounded-lg p-3 mt-4" style={{ background: 'rgba(16,185,129,0.05)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1">
            <Swords size={12} /> Create Match — Select 2 Fighters
          </h3>
          <div className="space-y-1 mb-3">
            {approved.map(app => (
              <button
                key={app.user_id}
                onClick={() => toggleFighter(app.user_id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                  selectedFighters.includes(app.user_id) ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-white/5 border border-transparent'
                }`}
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={app.avatar_url || ''} />
                  <AvatarFallback className="text-[9px]">{app.username?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold flex-1">{app.username}</span>
                {selectedFighters.includes(app.user_id) && <Check size={14} className="text-emerald-400" />}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[9px] text-zinc-500 uppercase block mb-1">Prize ($)</label>
              <Input value={matchPrize} onChange={e => setMatchPrize(e.target.value)} className="text-xs h-8" />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-zinc-500 uppercase block mb-1">Duration (hrs)</label>
              <Input value={matchDuration} onChange={e => setMatchDuration(e.target.value)} className="text-xs h-8" />
            </div>
          </div>

          {/* Sponsor */}
          <div className="mb-3 border border-blue-500/20 rounded-lg p-2.5" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 size={12} className="text-blue-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400">Sponsor / Campaign</span>
            </div>
            {campaigns.length > 0 && (
              <select
                value={sponsorCampaignId}
                onChange={e => handleCampaignSelect(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded text-xs text-foreground p-1.5 mb-2"
              >
                <option value="">No sponsor</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <Input
              placeholder="Sponsor name (or custom)"
              value={sponsorName}
              onChange={e => setSponsorName(e.target.value)}
              className="text-xs h-8 mb-1.5"
            />
            <Input
              placeholder="Sponsor logo URL (optional)"
              value={sponsorLogoUrl}
              onChange={e => setSponsorLogoUrl(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={selectedFighters.length !== 2}
            className="w-full py-2 bg-emerald-500 text-black text-xs font-black uppercase rounded-lg disabled:opacity-30"
          >
            Create Cash Battle
          </button>
        </div>
      )}

      {/* Active Battles with Settings */}
      {battles.length > 0 && (
        <details className="mt-3" open>
          <summary className="text-[10px] text-muted-foreground cursor-pointer uppercase tracking-wider mb-2">
            {battles.length} cash battle(s) created
          </summary>
          {battles.map(b => (
            <div key={b.id} className="bg-surface-0 border border-border p-3 mb-2 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{b.challenger_username}</span>
                  <Swords size={10} className="text-zinc-500" />
                  <span className="text-xs font-bold">{b.opponent_username || '???'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold">${(b.prize_cents / 100).toFixed(0)}</span>
                  <span className={`text-[9px] uppercase font-bold ${b.status === 'live' ? 'text-emerald-400' : 'text-zinc-500'}`}>{b.status}</span>
                  <button onClick={() => editingBattle === b.id ? setEditingBattle(null) : startEditing(b)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                    <Settings size={11} className="text-zinc-400" />
                  </button>
                </div>
              </div>
              {b.sponsor_name && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 size={9} className="text-blue-400" />
                  <span className="text-[9px] text-blue-400">Sponsored by {b.sponsor_name}</span>
                </div>
              )}
              {b.scenepack_url && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Download size={9} className="text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 truncate">Scenepack attached</span>
                </div>
              )}

              {/* Inline edit panel */}
              {editingBattle === b.id && (
                <div className="mt-2 pt-2 border-t border-border space-y-2">
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Prize ($)</label>
                    <Input value={editFields.prize || ''} onChange={e => setEditFields(f => ({ ...f, prize: e.target.value }))} className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Scenepack URL</label>
                    <Input value={editFields.scenepack_url || ''} onChange={e => setEditFields(f => ({ ...f, scenepack_url: e.target.value }))} placeholder="https://..." className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Theme / Sponsor one-liner</label>
                    <Input value={editFields.sponsor_name || ''} onChange={e => setEditFields(f => ({ ...f, sponsor_name: e.target.value }))} placeholder="e.g. WeirdCity Film Campaign" className="text-xs h-7" />
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 uppercase block mb-0.5">Admin Notes</label>
                    <Input value={editFields.admin_notes || ''} onChange={e => setEditFields(f => ({ ...f, admin_notes: e.target.value }))} placeholder="Internal notes..." className="text-xs h-7" />
                  </div>
                  <button onClick={() => saveBattleSettings(b.id)} className="w-full py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded flex items-center justify-center gap-1">
                    <Save size={11} /> Save Settings
                  </button>
                </div>
              )}
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
