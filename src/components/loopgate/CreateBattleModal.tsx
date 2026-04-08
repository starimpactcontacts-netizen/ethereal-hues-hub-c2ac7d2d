import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Clock, Trophy, Search, User, Gavel, Zap, Music } from "lucide-react";
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
  const [challengeType, setChallengeType] = useState<'open' | 'direct'>('open');
  const [duration, setDuration] = useState<number>(48);
  const [isRapid, setIsRapid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchResult | null>(null);
  const [judgeQuery, setJudgeQuery] = useState("");
  const [judgeResults, setJudgeResults] = useState<SearchResult[]>([]);
  const [selectedJudge, setSelectedJudge] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Featured song themes
  const [themeSongs, setThemeSongs] = useState<{ id: string; song_name: string; song_preview_url: string | null; title: string; artist_name: string }[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<typeof themeSongs[0] | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data } = await supabase
        .from('featured_drops')
        .select('id, song_name, song_preview_url, title, featured_artists(name)')
        .in('status', ['live', 'closed'])
        .not('song_preview_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) {
        setThemeSongs(data.map((d: any) => ({
          id: d.id,
          song_name: d.song_name,
          song_preview_url: d.song_preview_url,
          title: d.title,
          artist_name: d.featured_artists?.name || 'Unknown',
        })));
      }
    };
    if (isOpen) fetchSongs();
  }, [isOpen]);

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
    
    const result = await createBattle(
      profile.id,
      profile.username,
      profile.avatar_url,
      profile.league || 'open',
      duration,
      challengeType,
      selectedOpponent?.id,
      selectedOpponent?.username,
      selectedOpponent?.avatar_url
    );

    if (result.success && result.battleId) {
      // Always update is_rapid flag + theme song
      const updateData: any = { is_rapid: isRapid };
      if (selectedTheme) {
        updateData.theme_song_name = `${selectedTheme.artist_name} — ${selectedTheme.song_name}`;
        updateData.theme_song_preview_url = selectedTheme.song_preview_url;
        updateData.theme_drop_id = selectedTheme.id;
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
      toast.success(challengeType === 'open' ? "Battle posted! Waiting for challenger..." : "Challenge sent!");
      onSuccess(result.battleId);
    } else {
      toast.error(result.error || "Failed to create battle");
    }
  };

  if (!isOpen) return null;

  const durationOptions = isRapid ? [1, 2, 3] : [24, 48, 72];

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
          className="w-full max-w-md bg-background border-t border-red-500/30 rounded-t-2xl overflow-hidden"
          style={{ maxHeight: "85vh", marginBottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Header */}
          <div className="relative p-4 bg-gradient-to-r from-red-500/20 via-surface-1 to-red-500/20 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                <Swords className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground">Create 1v1 Battle</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Head-to-head showdown
                </p>
              </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface-1 rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(85vh - 80px)", WebkitOverflowScrolling: "touch" }}>
            {/* Rapid Mode Toggle */}
            <div>
              <button
                onClick={() => {
                  setIsRapid(!isRapid);
                  setDuration(!isRapid ? 3 : 48);
                }}
                className={`w-full p-3 border text-left transition-all flex items-center gap-3 ${
                  isRapid ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:border-amber-500/50'
                }`}
              >
                <Zap className={`w-5 h-5 ${isRapid ? 'text-amber-400' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <span className="text-sm font-display text-foreground block">⚡ Rapid Mode</span>
                  <span className="text-[10px] text-muted-foreground">1-3 hour battles · reuse existing edits · instant action</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors ${isRapid ? 'bg-amber-500' : 'bg-surface-2'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${isRapid ? 'ml-5.5 translate-x-0.5' : 'ml-0.5'}`} />
                </div>
              </button>
            </div>

            {/* Challenge Type */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Challenge Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChallengeType('open')}
                  className={`p-3 border text-left transition-all ${
                    challengeType === 'open' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
                  }`}
                >
                  <span className="text-sm font-display text-foreground block">Open Challenge</span>
                  <span className="text-[10px] text-muted-foreground">Anyone can accept</span>
                </button>
                <button
                  onClick={() => setChallengeType('direct')}
                  className={`p-3 border text-left transition-all ${
                    challengeType === 'direct' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
                  }`}
                >
                  <span className="text-sm font-display text-foreground block">Direct Challenge</span>
                  <span className="text-[10px] text-muted-foreground">Challenge a specific editor</span>
                </button>
              </div>
            </div>

            {/* Search Opponent (for direct) */}
            {challengeType === 'direct' && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Search Opponent</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by username..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 bg-surface-1 border-border" />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-border bg-surface-1 divide-y divide-border max-h-32 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button key={u.id} onClick={() => { setSelectedOpponent(u); setSearchQuery(""); setSearchResults([]); }} className="w-full flex items-center gap-3 p-2 hover:bg-surface-2 transition-colors">
                        <Avatar className="w-7 h-7"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400 text-xs">{u.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-sm text-foreground">{u.username}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto uppercase">{u.league}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedOpponent && (
                  <div className="mt-2 flex items-center gap-3 p-2 border border-red-500/50 bg-red-500/10">
                    <Avatar className="w-8 h-8 border-2 border-red-500"><AvatarImage src={selectedOpponent.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400">{selectedOpponent.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium text-foreground flex-1">{selectedOpponent.username}</span>
                    <button onClick={() => setSelectedOpponent(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                )}
              </div>
            )}

            {/* Pick Judge */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <Gavel className="w-3 h-3" /> Pick Your Judge
                <span className="text-[8px] text-muted-foreground/60 ml-1">(optional)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search judges..." value={judgeQuery} onChange={(e) => handleJudgeSearch(e.target.value)} className="pl-10 bg-surface-1 border-border" />
              </div>
              {judgeResults.length > 0 && (
                <div className="mt-2 border border-border bg-surface-1 divide-y divide-border max-h-32 overflow-y-auto">
                  {judgeResults.map((j) => (
                    <button key={j.id} onClick={() => { setSelectedJudge(j); setJudgeQuery(""); setJudgeResults([]); }} className="w-full flex items-center gap-3 p-2 hover:bg-surface-2 transition-colors">
                      <Avatar className="w-7 h-7"><AvatarImage src={j.avatar_url || ''} /><AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs">{j.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                      <span className="text-sm text-foreground">{j.username}</span>
                      <span className="text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-auto">JUDGE</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedJudge && (
                <div className="mt-2 flex items-center gap-3 p-2 border border-purple-500/50 bg-purple-500/10">
                  <Avatar className="w-8 h-8 border-2 border-purple-500"><AvatarImage src={selectedJudge.avatar_url || ''} /><AvatarFallback className="bg-purple-500/20 text-purple-400">{selectedJudge.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{selectedJudge.username}</span>
                    <span className="text-[9px] text-purple-400 block">Will be requested to judge</span>
                  </div>
                  <button onClick={() => setSelectedJudge(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              )}
            </div>

            {/* Theme Song */}
            {themeSongs.length > 0 && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                  <Music className="w-3 h-3" /> Battle Theme Song
                  <span className="text-[8px] text-muted-foreground/60 ml-1">(optional)</span>
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {themeSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedTheme(selectedTheme?.id === song.id ? null : song)}
                      className={`w-full flex items-center gap-2 p-2 border rounded-lg text-left transition-all ${
                        selectedTheme?.id === song.id ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'
                      }`}
                    >
                      <Music className={`w-4 h-4 shrink-0 ${selectedTheme?.id === song.id ? 'text-purple-400' : 'text-muted-foreground'}`} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground truncate block">{song.song_name}</span>
                        <span className="text-[9px] text-muted-foreground">{song.artist_name} • {song.title}</span>
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
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">
                {isRapid ? 'Rapid Duration' : 'Battle Duration'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDuration(hours)}
                    className={`p-3 border text-center transition-all ${
                      duration === hours ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-lg font-display text-foreground">{hours}h</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stakes */}
            <div className="bg-surface-1 border border-border p-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" /> Battle Stakes
              </h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Winner gets</span><span className="text-gold font-bold">+20 Index</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Loser penalty</span><span className="text-red-400 font-bold">-5 Index</span></div>
              </div>
            </div>

            {/* Your Info */}
            <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border">
              <Avatar className="w-10 h-10 border-2 border-gold"><AvatarImage src={profile?.avatar_url || ''} /><AvatarFallback className="bg-gold/20 text-gold">{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{profile?.username}</span>
                <span className="text-[10px] text-muted-foreground block uppercase">{profile?.league} League</span>
              </div>
              <span className="text-[10px] text-gold uppercase">Challenger</span>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={loading || (challengeType === 'direct' && !selectedOpponent)}
              className="w-full h-12 bg-gradient-to-r from-red-500 via-red-400 to-red-500 hover:shadow-lg hover:shadow-red-500/30 text-white font-display text-sm uppercase tracking-wider"
            >
              {loading ? <span className="animate-pulse">Creating...</span> : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  {isRapid ? '⚡ Post Rapid Battle' : challengeType === 'open' ? 'Post Open Challenge' : 'Send Challenge'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
