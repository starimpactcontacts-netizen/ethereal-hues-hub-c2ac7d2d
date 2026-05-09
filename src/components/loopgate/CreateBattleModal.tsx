import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Clock, Trophy, Search, Gavel, Globe2, Target, Lock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { createBattle } from "@/hooks/useBattles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreateBattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (battleId: string) => void;
}

interface SearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  league: string;
}

export default function CreateBattleModal({ isOpen, onClose, onSuccess }: CreateBattleModalProps) {
  const { profile } = useAuth();
  const [challengeType, setChallengeType] = useState<'open' | 'direct' | 'private'>('open');
  const [duration, setDuration] = useState<number>(1);
  const [battleMode, setBattleMode] = useState<'scenepack' | 'premade'>('scenepack');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchResult | null>(null);
  const [judgeQuery, setJudgeQuery] = useState("");
  const [judgeResults, setJudgeResults] = useState<SearchResult[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, league')
      .ilike('username', `%${query}%`)
      .neq('id', profile?.id)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleJudgeSearch = async (query: string) => {
    setJudgeQuery(query);
    if (query.length < 2) { setJudgeResults([]); return; }
    // Search for judges (users with judge role)
    const { data: judgeRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'judge');
    
    const judgeIds = judgeRoles?.map(r => r.user_id) || [];
    
    if (judgeIds.length === 0) {
      // Fallback: search all users if no judges found
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, league')
        .ilike('username', `%${query}%`)
        .neq('id', profile?.id)
        .limit(5);
      setJudgeResults(data || []);
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, league')
        .ilike('username', `%${query}%`)
        .in('id', judgeIds)
        .neq('id', profile?.id)
        .limit(5);
      setJudgeResults(data || []);
    }
  };

  const handleCreate = async () => {
    if (!profile) {
      toast.error("You must be signed in to post a battle");
      return;
    }
    if (challengeType === 'direct' && !selectedOpponent) {
      toast.error("Select an opponent for direct challenge");
      return;
    }

    setLoading(true);
    let result: { success: boolean; battleId?: string; error?: string } = { success: false };
    try {
      // Private lobby = open battle but flagged unlisted
      const effectiveType: 'open' | 'direct' = challengeType === 'private' ? 'open' : challengeType;
      result = await createBattle(
        profile.id,
        profile.username,
        profile.avatar_url,
        profile.league || 'open',
        duration,
        effectiveType,
        selectedOpponent?.id,
        selectedOpponent?.username,
        selectedOpponent?.avatar_url
      );

      if (result.success && result.battleId) {
      // Rapid is implicit when duration <= 1 hour
      const updateData: any = {
        is_rapid: duration <= 1,
        submission_mode: battleMode === 'scenepack' ? 'create' : 'reuse',
      };
      if (challengeType === 'private') {
        updateData.is_private = true;
      }
      if (selectedJudge) {
        // Specific judge selected — send them a request
        updateData.requested_judge_id = selectedJudge.id;
        updateData.requested_judge_username = selectedJudge.username;
        updateData.judge_status = 'requested';
      } else {
        // No judge selected — broadcast to ALL judges' inboxes
        updateData.judge_status = 'none';
      }

      const { error: updateErr } = await supabase
        .from('battles')
        .update(updateData)
        .eq('id', result.battleId);
      if (updateErr) console.error('battle update failed (non-fatal):', updateErr);

      // Judge notifications — wrap so failures don't kill the flow
      try {
      if (selectedJudge) {
        await supabase.from('notifications').insert({
          user_id: selectedJudge.id,
          type: 'battle_judge_request',
          title: '⚔️ Judge Request',
          message: `@${profile.username} wants you to judge their 1v1 battle!`,
          data: { battle_id: result.battleId, challenger_username: profile.username },
        });
      } else {
        const { data: judgeRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'judge');

        if (judgeRoles && judgeRoles.length > 0) {
          const notifications = judgeRoles
            .filter(r => r.user_id !== profile.id)
            .map(r => ({
              user_id: r.user_id,
              type: 'battle_judge_open',
              title: '⚔️ Battle Needs a Judge',
              message: `@${profile.username} posted a 1v1 battle — claim it to officiate!`,
              data: { battle_id: result.battleId, challenger_username: profile.username },
            }));

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
      }
      } catch (notifyErr) {
        console.error('judge notify failed (non-fatal):', notifyErr);
      }

      // Notify opponent for direct challenges
      if (challengeType === 'direct' && selectedOpponent) {
        try {
          await supabase.from('notifications').insert({
          user_id: selectedOpponent.id,
          type: 'battle_challenge',
          title: '⚔️ You\'ve Been Challenged!',
          message: `@${profile.username} is calling you out for a 1v1 battle!`,
          data: { battle_id: result.battleId, challenger_username: profile.username },
        });
        } catch (e) { console.error('opponent notify failed (non-fatal):', e); }
      }
      }
    } catch (e: any) {
      console.error('handleCreate fatal:', e);
      toast.error(e?.message || 'Failed to create battle');
    } finally {
      setLoading(false);
    }

    if (result.success && result.battleId) {
      if (challengeType === 'private') {
        const link = `${window.location.origin}/battle/${result.battleId}`;
        try {
          await navigator.clipboard.writeText(link);
          toast.success("Lobby created — invite link copied!", { description: link, duration: 6000 });
        } catch {
          toast.success("Lobby created!", { description: link, duration: 8000 });
        }
      } else {
        toast.success(challengeType === 'open' ? "Battle posted! Waiting for challenger..." : "Challenge sent!");
      }
      onSuccess(result.battleId);
    } else {
      if (result.error) toast.error(result.error);
    }
  };

  // Hide top bar + bottom nav while sheet is open so CTA is reachable
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('battle-modal-open');
    return () => { document.body.classList.remove('battle-modal-open'); };
  }, [isOpen]);

  if (!isOpen) return null;

  // Edit battles span quick rapid sessions to a full day
  const durationOptions: { value: number; label: string }[] = [
    { value: 0.25, label: '15M' },
    { value: 0.5, label: '30M' },
    { value: 1, label: '1H' },
    { value: 3, label: '3H' },
    { value: 24, label: '24H' },
  ];

  // Index prize is FIXED — XP is what scales massively with duration
  const FIXED_STAKES = { win: 20, lose: 5 };
  const xpByDuration: Record<string, number> = {
    '0.25': 2500,
    '0.5':  5000,
    '1':    10000,
    '3':    25000,
    '24':   100000,
  };
  const xpReward = xpByDuration[String(duration)] || 10000;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-t-[32px] overflow-hidden relative flex flex-col"
          style={{
            maxHeight: "100dvh",
            height: "100dvh",
            background: "rgba(14,14,16,0.92)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            boxShadow: "0 -24px 80px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-9 h-[3px] rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="relative px-5 pt-1 pb-3 flex items-center justify-between shrink-0 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/10 border border-red-400/30 flex items-center justify-center">
                <Swords className="w-4 h-4 text-red-300" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="font-display text-[18px] text-white tracking-tight leading-none">New Battle</h2>
                <p className="text-[10px] text-zinc-500 mt-1 tracking-wide">Winner takes Index</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 transition-all flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-zinc-300" strokeWidth={2.5} />
            </button>
          </div>

          <div
            className="px-4 pt-4 space-y-3.5 overflow-y-auto overscroll-contain flex-1 min-h-0"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {/* Challenge Type */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block font-semibold">Challenge Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setChallengeType('open')}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    challengeType === 'open'
                      ? 'bg-gradient-to-br from-red-500/25 to-red-600/10 border border-red-400/50 shadow-[0_0_20px_-4px_rgba(239,68,68,0.5)]'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <Globe2 className={`w-4 h-4 mb-1.5 ${challengeType === 'open' ? 'text-red-300' : 'text-zinc-500'}`} />
                  <span className="text-[13px] font-semibold text-white block">Open</span>
                  <span className="text-[9px] text-zinc-500">Anyone joins</span>
                </button>
                <button
                  onClick={() => setChallengeType('direct')}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    challengeType === 'direct'
                      ? 'bg-gradient-to-br from-red-500/25 to-red-600/10 border border-red-400/50 shadow-[0_0_20px_-4px_rgba(239,68,68,0.5)]'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <Target className={`w-4 h-4 mb-1.5 ${challengeType === 'direct' ? 'text-red-300' : 'text-zinc-500'}`} />
                  <span className="text-[13px] font-semibold text-white block">Invite</span>
                  <span className="text-[9px] text-zinc-500">Pick editor</span>
                </button>
                <button
                  onClick={() => setChallengeType('private')}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    challengeType === 'private'
                      ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-400/50 shadow-[0_0_20px_-4px_rgba(245,158,11,0.5)]'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <Lock className={`w-4 h-4 mb-1.5 ${challengeType === 'private' ? 'text-amber-300' : 'text-zinc-500'}`} />
                  <span className="text-[13px] font-semibold text-white block">Private</span>
                  <span className="text-[9px] text-zinc-500">Share link</span>
                </button>
              </div>
              {challengeType === 'private' && (
                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                  <Link2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[10.5px] text-amber-100/80 leading-relaxed">
                    Lobby is unlisted. You'll get an invite link to share — only people with the link can join.
                  </p>
                </div>
              )}
            </div>

            {/* Search Opponent (for direct) */}
            {challengeType === 'direct' && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block font-semibold">Search Opponent</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input placeholder="@username" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 h-11 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600" />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button key={u.id} onClick={() => { setSelectedOpponent(u); setSearchQuery(""); setSearchResults([]); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0">
                        <Avatar className="w-7 h-7"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400 text-xs">{u.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-sm text-white">{u.username}</span>
                        <span className="text-[10px] text-zinc-500 ml-auto uppercase">{u.league}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedOpponent && (
                  <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-red-400/40 bg-red-500/10">
                    <Avatar className="w-8 h-8 border-2 border-red-500"><AvatarImage src={selectedOpponent.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400">{selectedOpponent.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium text-white flex-1">{selectedOpponent.username}</span>
                    <button onClick={() => setSelectedOpponent(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-white" /></button>
                  </div>
                )}
              </div>
            )}

            {/* Pick Judge */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                <Gavel className="w-3 h-3" /> Judge
                <span className="text-[9px] text-zinc-600 ml-1 normal-case tracking-normal">optional</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input placeholder="Search judges" value={judgeQuery} onChange={(e) => handleJudgeSearch(e.target.value)} className="pl-10 h-11 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600" />
              </div>
              {judgeResults.length > 0 && (
                <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden max-h-40 overflow-y-auto">
                  {judgeResults.map((j) => (
                    <button key={j.id} onClick={() => { setSelectedJudge(j); setJudgeQuery(""); setJudgeResults([]); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0">
                      <Avatar className="w-7 h-7"><AvatarImage src={j.avatar_url || ''} /><AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs">{j.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <span className="text-sm text-white">{j.username}</span>
                      <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-auto">JUDGE</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedJudge && (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-xl border border-purple-400/40 bg-purple-500/10">
                  <Avatar className="w-8 h-8 border-2 border-purple-500"><AvatarImage src={selectedJudge.avatar_url || ''} /><AvatarFallback className="bg-purple-500/20 text-purple-400">{selectedJudge.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{selectedJudge.username}</span>
                    <span className="text-[9px] text-purple-400 block">Will be requested to judge</span>
                  </div>
                  <button onClick={() => setSelectedJudge(null)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><X className="w-3.5 h-3.5 text-white" /></button>
                </div>
              )}
            </div>

            {/* Battle Mode */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block font-semibold">Battle Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBattleMode('scenepack')}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    battleMode === 'scenepack'
                      ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-400/50 shadow-[0_0_18px_-4px_rgba(16,185,129,0.45)]'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <Package className={`w-4 h-4 mb-1.5 ${battleMode === 'scenepack' ? 'text-emerald-300' : 'text-zinc-500'}`} />
                  <span className="text-[13px] font-semibold text-white block">Scenepack</span>
                  <span className="text-[9px] text-zinc-500">Both vote, edit live</span>
                </button>
                <button
                  onClick={() => setBattleMode('premade')}
                  className={`p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                    battleMode === 'premade'
                      ? 'bg-gradient-to-br from-sky-500/20 to-sky-600/5 border border-sky-400/50 shadow-[0_0_18px_-4px_rgba(56,189,248,0.45)]'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  <Upload className={`w-4 h-4 mb-1.5 ${battleMode === 'premade' ? 'text-sky-300' : 'text-zinc-500'}`} />
                  <span className="text-[13px] font-semibold text-white block">Pre-Made</span>
                  <span className="text-[9px] text-zinc-500">Submit existing edit</span>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block font-semibold">
                Duration
              </label>
              <div className="grid grid-cols-5 gap-2">
                {durationOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDuration(value)}
                    className={`px-1 py-2.5 rounded-xl text-center transition-all active:scale-[0.97] ${
                      duration === value
                        ? 'bg-gradient-to-br from-red-500/25 to-red-600/10 border border-red-400/50 shadow-[0_0_16px_-4px_rgba(239,68,68,0.5)]'
                        : 'bg-white/[0.04] border border-white/[0.06]'
                    }`}
                  >
                    <span className={`text-[13px] font-display block ${duration === value ? 'text-white' : 'text-zinc-300'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* XP Reward — hero block, Index prize is fixed */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/[0.18] via-fuchsia-500/[0.10] to-transparent border border-violet-400/30 shadow-[0_0_30px_-8px_rgba(168,85,247,0.4)] relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-violet-300 uppercase tracking-[0.2em]">XP Reward</span>
                  <span className="ml-auto text-[9px] text-violet-300/60 uppercase tracking-wide">Winner</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[44px] leading-none text-white tracking-tight tabular-nums">
                    +{xpReward.toLocaleString()}
                  </span>
                  <span className="font-display text-[18px] text-violet-300 tracking-wide">XP</span>
                </div>
                <p className="text-[10.5px] text-zinc-400 mt-1.5 leading-relaxed">
                  Longer battles = <span className="text-violet-200 font-semibold">massive XP</span>. Index prize stays fixed at <span className="text-emerald-300 font-semibold">+{FIXED_STAKES.win} IDX</span> · <span className="text-red-300 font-semibold">−{FIXED_STAKES.lose} IDX</span>.
                </p>
              </div>
            </div>

          </div>

          {/* Sticky Footer CTA */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pt-3 shrink-0 pointer-events-none"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              background: "linear-gradient(180deg, rgba(14,14,16,0) 0%, rgba(14,14,16,0.92) 35%, rgba(14,14,16,0.98) 100%)",
            }}
          >
            <Button
              onClick={handleCreate}
              disabled={loading || (challengeType === 'direct' && !selectedOpponent)}
              className="pointer-events-auto w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white font-display text-[13px] uppercase tracking-[0.18em] shadow-[0_8px_24px_-6px_rgba(239,68,68,0.6)] border border-red-400/40"
            >
              {loading ? <span className="animate-pulse">Creating...</span> : (
                <>
                  {challengeType === 'private' ? <Lock className="w-3.5 h-3.5 mr-2" /> : <Swords className="w-3.5 h-3.5 mr-2" />}
                  {challengeType === 'open' ? 'Post Battle' : challengeType === 'private' ? 'Create Lobby' : 'Send Challenge'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
