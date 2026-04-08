import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Search, Trophy } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, league')
      .ilike('username', `%${query}%`)
      .neq('id', profile?.id)
      .limit(5);
    setSearchResults(data || []);
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
      24, // Fixed 24h duration
      challengeType,
      selectedOpponent?.id,
      selectedOpponent?.username,
      selectedOpponent?.avatar_url
    );

    if (result.success && result.battleId) {
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
      toast.success(challengeType === 'open' ? "Battle posted! Waiting for opponent..." : "Challenge sent!");
      onSuccess(result.battleId);
    } else {
      toast.error(result.error || "Failed to create battle");
    }
  };

  if (!isOpen) return null;

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
          style={{ maxHeight: "70vh", marginBottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Header */}
          <div className="relative p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base text-foreground">Start 1v1 Battle</h2>
                <p className="text-[10px] text-muted-foreground">24h · Both editors submit their best edit</p>
              </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-surface-1 rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(70vh - 72px)", WebkitOverflowScrolling: "touch" }}>
            {/* Challenge Type */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Who are you battling?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setChallengeType('open'); setSelectedOpponent(null); }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    challengeType === 'open' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground block">Open</span>
                  <span className="text-[10px] text-muted-foreground">Anyone can accept</span>
                </button>
                <button
                  onClick={() => setChallengeType('direct')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    challengeType === 'direct' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground block">Call Out</span>
                  <span className="text-[10px] text-muted-foreground">Challenge someone</span>
                </button>
              </div>
            </div>

            {/* Search Opponent (for direct) */}
            {challengeType === 'direct' && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Search Opponent</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by username..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10 bg-surface-1 border-border rounded-lg" />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-border bg-surface-1 rounded-lg divide-y divide-border max-h-32 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button key={u.id} onClick={() => { setSelectedOpponent(u); setSearchQuery(""); setSearchResults([]); }} className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-2 transition-colors">
                        <Avatar className="w-7 h-7"><AvatarImage src={u.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400 text-xs">{u.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-sm text-foreground">{u.username}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto uppercase">{u.league}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedOpponent && (
                  <div className="mt-2 flex items-center gap-3 p-2.5 border border-red-500/50 bg-red-500/10 rounded-lg">
                    <Avatar className="w-8 h-8 border-2 border-red-500"><AvatarImage src={selectedOpponent.avatar_url || ''} /><AvatarFallback className="bg-red-500/20 text-red-400">{selectedOpponent.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium text-foreground flex-1">{selectedOpponent.username}</span>
                    <button onClick={() => setSelectedOpponent(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            <div className="bg-surface-1 border border-border rounded-lg p-3">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-gold" /> How it works
              </h3>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p>• Both editors get <span className="text-foreground font-medium">24 hours</span> to submit their best edit</p>
                <p>• Community votes decide the winner</p>
                <p>• Winner gets <span className="text-gold font-bold">+20 Index</span>, loser gets <span className="text-red-400">-5 Index</span></p>
              </div>
            </div>

            {/* Your Info */}
            <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border rounded-lg">
              <Avatar className="w-9 h-9 border-2 border-gold"><AvatarImage src={profile?.avatar_url || ''} /><AvatarFallback className="bg-gold/20 text-gold">{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">{profile?.username}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{profile?.league} League</span>
              </div>
              <span className="text-[10px] text-gold uppercase font-medium">Challenger</span>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreate}
              disabled={loading || (challengeType === 'direct' && !selectedOpponent)}
              className="w-full h-11 bg-red-500 hover:bg-red-600 text-white font-bold text-sm uppercase tracking-wider rounded-lg"
            >
              {loading ? <span className="animate-pulse">Creating...</span> : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  {challengeType === 'open' ? 'Post Battle' : 'Send Challenge'}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
