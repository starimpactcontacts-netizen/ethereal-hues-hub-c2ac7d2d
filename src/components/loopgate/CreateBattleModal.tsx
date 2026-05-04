import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Clock, Trophy, Search, User, Gavel, Zap, Globe2, Target, Film, Lock, Link2, Copy, Package, Upload } from "lucide-react";
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
  const [duration, setDuration] = useState<number>(48);
  const [isRapid, setIsRapid] = useState(false);
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
    if (!profile) return;
    if (challengeType === 'direct' && !selectedOpponent) {
      toast.error("Select an opponent for direct challenge");
      return;
    }

    setLoading(true);
    // Private lobby = open battle but flagged unlisted
    const effectiveType: 'open' | 'direct' = challengeType === 'private' ? 'open' : challengeType;
    const result = await createBattle(
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
      // Always update is_rapid flag + theme song
      const updateData: any = { is_rapid: isRapid };
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
        updateData.judge_status = 'open';
      }

      await supabase
        .from('battles')
        .update(updateData)
        .eq('id', result.battleId);

      // Judge notifications
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

      // Notify opponent for direct challenges
      if (challengeType === 'direct' && selectedOpponent) {
        await supabase.from('notifications').insert({
          user_id: selectedOpponent.id,
          type: 'battle_challenge',
          title: '⚔️ You\'ve Been Challenged!',
          message: `@${profile.username} is calling you out for a 1v1 battle!`,
          data: { battle_id: result.battleId, challenger_username: profile.username },
        });
      }
    }

    setLoading(false);

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
      toast.error(result.error || "Failed to create battle");
    }
  };

  if (!isOpen) return null;

  // Edit battles cap at 1 hour — fast turnaround like a game match
  const durationOptions = [1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
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
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 16px)",
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
            {/* Rapid Mode Toggle */}
            <div>
              <button
                onClick={() => {
                  setIsRapid(!isRapid);
                  setDuration(!isRapid ? 3 : 48);
                }}
                className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center gap-3 active:scale-[0.99] ${
                  isRapid
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-400/40 shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)]'
                    : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isRapid ? 'bg-amber-500/25' : 'bg-white/[0.06]'}`}>
                  <Zap className={`w-4.5 h-4.5 ${isRapid ? 'text-amber-300 fill-amber-300' : 'text-zinc-500'}`} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-white block">Rapid Mode</span>
                  <span className="text-[10px] text-zinc-500">1-3h battles · instant action</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${isRapid ? 'bg-amber-500' : 'bg-white/10'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${isRapid ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </button>
            </div>

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

            {/* Theme Song */}
            {themeSongs.length > 0 && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                  <Music className="w-3 h-3" /> Theme Song
                  <span className="text-[9px] text-zinc-600 ml-1 normal-case tracking-normal">optional</span>
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {themeSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedTheme(selectedTheme?.id === song.id ? null : song)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                        selectedTheme?.id === song.id
                          ? 'border border-purple-400/50 bg-purple-500/10'
                          : 'border border-white/[0.06] bg-white/[0.03]'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTheme?.id === song.id ? 'bg-purple-500/25' : 'bg-white/[0.06]'}`}>
                        <Music className={`w-4 h-4 ${selectedTheme?.id === song.id ? 'text-purple-300' : 'text-zinc-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white truncate block">{song.song_name}</span>
                        <span className="text-[10px] text-zinc-500 truncate block">{song.artist_name}</span>
                      </div>
                      {song.song_preview_url && selectedTheme?.id === song.id && (
                        <audio src={song.song_preview_url} controls className="h-6 w-24 shrink-0" onClick={(e) => e.stopPropagation()} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block font-semibold">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {durationOptions.map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDuration(hours)}
                    className={`p-3 rounded-2xl text-center transition-all active:scale-[0.97] ${
                      duration === hours
                        ? 'bg-gradient-to-br from-red-500/25 to-red-600/10 border border-red-400/50 shadow-[0_0_16px_-4px_rgba(239,68,68,0.5)]'
                        : 'bg-white/[0.04] border border-white/[0.06]'
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${duration === hours ? 'text-red-300' : 'text-zinc-500'}`} />
                    <span className="text-base font-display text-white">{hours}H</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stakes */}
            <div className="rounded-2xl p-3.5 bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Stakes</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <span className="text-[9px] text-emerald-300/70 uppercase block">Winner</span>
                  <span className="text-sm font-display text-emerald-300">+20 IDX</span>
                </div>
                <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <span className="text-[9px] text-red-300/70 uppercase block">Loser</span>
                  <span className="text-sm font-display text-red-300">−5 IDX</span>
                </div>
              </div>
            </div>

            {/* Your Info */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <Avatar className="w-10 h-10 ring-2 ring-amber-400/60"><AvatarImage src={profile?.avatar_url || ''} /><AvatarFallback className="bg-amber-500/20 text-amber-400">{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1">
                <span className="text-sm font-semibold text-white">{profile?.username}</span>
                <span className="text-[10px] text-zinc-500 block uppercase">{profile?.league} League</span>
              </div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/30">You</span>
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
