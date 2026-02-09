import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Swords, Trophy, Clock, Eye, ExternalLink, Crown, Gavel,
  CheckCircle, XCircle, Play, Square, SkipForward, AlertTriangle,
  ChevronDown, ChevronUp, Search, RefreshCw
} from "lucide-react";

interface AdminBattle {
  id: string;
  challenger_id: string;
  opponent_id: string | null;
  challenger_username: string;
  opponent_username: string | null;
  challenger_avatar_url: string | null;
  opponent_avatar_url: string | null;
  challenge_type: string;
  league_tier: string;
  duration_hours: number;
  status: string;
  accepted_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  challenger_submission_url: string | null;
  challenger_submission_platform: string | null;
  challenger_submitted_at: string | null;
  opponent_submission_url: string | null;
  opponent_submission_platform: string | null;
  opponent_submitted_at: string | null;
  judge_id: string | null;
  challenger_score: number | null;
  opponent_score: number | null;
  judge_notes: string | null;
  judged_at: string | null;
  challenger_votes: number;
  opponent_votes: number;
  view_count: number;
  winner_id: string | null;
  winner_index_awarded: number | null;
  loser_index_penalty: number | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "OPEN", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  accepted: { label: "ACCEPTED", color: "bg-sky-500/20 text-sky-400 border-sky-500/40" },
  active: { label: "ACTIVE", color: "bg-red-500/20 text-red-400 border-red-500/40" },
  judging: { label: "JUDGING", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  completed: { label: "COMPLETED", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  cancelled: { label: "CANCELLED", color: "bg-muted text-muted-foreground border-border" },
  forfeited: { label: "FORFEIT", color: "bg-muted text-muted-foreground border-border" },
};

export default function BattleAdminPanel() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<AdminBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Scoring state
  const [scoringBattle, setScoringBattle] = useState<string | null>(null);
  const [scores, setScores] = useState({ challenger: 50, opponent: 50 });
  const [judgeNotes, setJudgeNotes] = useState("");

  const fetchBattles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("battles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setBattles(data as AdminBattle[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBattles();

    const channel = supabase
      .channel("admin-battles")
      .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, () => fetchBattles())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBattles]);

  // ── Admin Actions ──────────────────────────────────────────────────

  async function forceStatus(battleId: string, newStatus: string) {
    setActionLoading(battleId);
    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === "active") {
        const battle = battles.find(b => b.id === battleId);
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + (battle?.duration_hours || 48) * 60 * 60 * 1000);
        updates.starts_at = startsAt.toISOString();
        updates.ends_at = endsAt.toISOString();
        updates.accepted_at = startsAt.toISOString();
      }

      if (newStatus === "judging") {
        // Move directly to judging regardless of submissions
      }

      const { error } = await supabase.from("battles").update(updates).eq("id", battleId);
      if (error) throw error;
      toast.success(`Battle status → ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function declareWinner(battleId: string, winnerId: string, winnerUsername: string) {
    setActionLoading(battleId);
    try {
      const battle = battles.find(b => b.id === battleId);
      if (!battle) throw new Error("Battle not found");

      const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;
      const winnerIdx = battle.winner_index_awarded ?? 20;
      const loserPenalty = battle.loser_index_penalty ?? 5;

      const { error } = await supabase
        .from("battles")
        .update({
          winner_id: winnerId,
          status: "completed",
          judged_at: new Date().toISOString(),
          judge_id: user?.id,
        })
        .eq("id", battleId);

      if (error) throw error;

      // Award/penalize index
      await supabase.rpc("award_xp", {
        p_user_id: winnerId,
        p_amount: winnerIdx,
        p_action: "battle_win",
        p_description: `Won 1v1 battle (+${winnerIdx} IDX)`,
      });

      if (loserId) {
        // Deduct from loser's spendable index (don't go negative on XP)
        await supabase
          .from("profiles")
          .update({})
          .eq("id", loserId);
        // Use negative XP as penalty
        await supabase.rpc("award_xp", {
          p_user_id: loserId,
          p_amount: -loserPenalty,
          p_action: "battle_loss",
          p_description: `Lost 1v1 battle (-${loserPenalty} IDX)`,
        });
      }

      // Notifications
      await supabase.from("notifications").insert([
        {
          user_id: winnerId,
          type: "battle_won",
          title: "🏆 Battle Won!",
          message: `You won the 1v1 battle! +${winnerIdx} Index awarded.`,
          data: { battle_id: battleId },
          read: false,
        },
        ...(loserId ? [{
          user_id: loserId,
          type: "battle_lost",
          title: "⚔️ Battle Result",
          message: `You lost the 1v1 against ${winnerUsername}. -${loserPenalty} Index.`,
          data: { battle_id: battleId },
          read: false,
        }] : []),
      ]);

      toast.success(`${winnerUsername} declared winner! Index updated.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function submitScoresAndDecide(battleId: string) {
    setActionLoading(battleId);
    try {
      const battle = battles.find(b => b.id === battleId);
      if (!battle) throw new Error("Battle not found");

      const winnerId = scores.challenger > scores.opponent
        ? battle.challenger_id
        : scores.opponent > scores.challenger
        ? battle.opponent_id
        : null; // tie

      const { error } = await supabase
        .from("battles")
        .update({
          challenger_score: scores.challenger,
          opponent_score: scores.opponent,
          judge_notes: judgeNotes || null,
          judge_id: user?.id,
          judged_at: new Date().toISOString(),
          winner_id: winnerId,
          status: "completed",
        })
        .eq("id", battleId);

      if (error) throw error;

      // Award index
      const winnerIdx = battle.winner_index_awarded ?? 20;
      const loserPenalty = battle.loser_index_penalty ?? 5;

      if (winnerId) {
        const loserId = winnerId === battle.challenger_id ? battle.opponent_id : battle.challenger_id;
        const winnerName = winnerId === battle.challenger_id ? battle.challenger_username : battle.opponent_username;

        await supabase.rpc("award_xp", {
          p_user_id: winnerId,
          p_amount: winnerIdx,
          p_action: "battle_win",
          p_description: `Won 1v1 battle (+${winnerIdx} IDX)`,
        });

        if (loserId) {
          await supabase.rpc("award_xp", {
            p_user_id: loserId,
            p_amount: -loserPenalty,
            p_action: "battle_loss",
            p_description: `Lost 1v1 battle (-${loserPenalty} IDX)`,
          });
        }

        // Notifications
        await supabase.from("notifications").insert([
          {
            user_id: winnerId,
            type: "battle_won",
            title: "🏆 Battle Won!",
            message: `You won with a score of ${winnerId === battle.challenger_id ? scores.challenger : scores.opponent}! +${winnerIdx} Index.`,
            data: { battle_id: battleId },
            read: false,
          },
          ...(loserId ? [{
            user_id: loserId,
            type: "battle_lost",
            title: "⚔️ Battle Decided",
            message: `You scored ${loserId === battle.challenger_id ? scores.challenger : scores.opponent}. -${loserPenalty} Index.`,
            data: { battle_id: battleId },
            read: false,
          }] : []),
        ]);

        toast.success(`Scored & decided! ${winnerName} wins.`);
      } else {
        toast.success("Scored as a tie — no index change.");
      }

      setScoringBattle(null);
      setScores({ challenger: 50, opponent: 50 });
      setJudgeNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function cancelBattle(battleId: string) {
    setActionLoading(battleId);
    try {
      const { error } = await supabase
        .from("battles")
        .update({ status: "cancelled" })
        .eq("id", battleId);
      if (error) throw error;
      toast.success("Battle cancelled");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Filtering ──────────────────────────────────────────────────────

  const filtered = battles.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.challenger_username.toLowerCase().includes(q) ||
      (b.opponent_username?.toLowerCase().includes(q)) ||
      b.id.toLowerCase().includes(q) ||
      b.status.includes(q)
    );
  });

  const byStatus = (s: string[]) => filtered.filter(b => s.includes(b.status));
  const activeBattles = byStatus(["active", "judging"]);
  const pendingBattles = byStatus(["pending", "accepted"]);
  const completedBattles = byStatus(["completed"]);
  const otherBattles = byStatus(["cancelled", "forfeited"]);

  // ── Render ─────────────────────────────────────────────────────────

  function renderBattle(battle: AdminBattle) {
    const status = STATUS_MAP[battle.status] || STATUS_MAP.pending;
    const isExpanded = expandedId === battle.id;
    const isScoring = scoringBattle === battle.id;
    const isLoading = actionLoading === battle.id;

    return (
      <div key={battle.id} className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Summary row */}
        <button
          onClick={() => setExpandedId(isExpanded ? null : battle.id)}
          className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface-1 transition-colors"
        >
          {/* Avatars */}
          <div className="flex items-center -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-red-500/40">
              <AvatarImage src={battle.challenger_avatar_url || ""} />
              <AvatarFallback className="bg-red-500/20 text-red-400 text-[10px] font-bold">
                {battle.challenger_username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {battle.opponent_id ? (
              <Avatar className="w-8 h-8 border-2 border-sky-500/40">
                <AvatarImage src={battle.opponent_avatar_url || ""} />
                <AvatarFallback className="bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                  {battle.opponent_username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-surface-2 text-muted-foreground text-xs">?</div>
            )}
          </div>

          {/* Names */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate block">
              {battle.challenger_username} vs {battle.opponent_username || "???"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {battle.duration_hours}h • {battle.league_tier} • {new Date(battle.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Status + expand */}
          <Badge className={`text-[9px] border ${status.color}`}>{status.label}</Badge>
          {battle.winner_id && <Crown className="w-4 h-4 text-gold" />}
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Expanded Detail */}
        {isExpanded && (
          <div className="border-t border-border p-4 space-y-4 bg-surface-1/50">
            {/* Submissions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Challenger</span>
                <p className="text-xs font-semibold text-foreground">{battle.challenger_username}</p>
                {battle.challenger_submission_url ? (
                  <a href={battle.challenger_submission_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-gold hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {battle.challenger_submission_platform || "View"} submission
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No submission yet</span>
                )}
                {battle.challenger_score !== null && (
                  <span className="text-sm font-bold text-gold">{battle.challenger_score} pts</span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Opponent</span>
                <p className="text-xs font-semibold text-foreground">{battle.opponent_username || "—"}</p>
                {battle.opponent_submission_url ? (
                  <a href={battle.opponent_submission_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-gold hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {battle.opponent_submission_platform || "View"} submission
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No submission yet</span>
                )}
                {battle.opponent_score !== null && (
                  <span className="text-sm font-bold text-gold">{battle.opponent_score} pts</span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{battle.view_count} views</span>
              <span>•</span>
              <span>{battle.challenger_votes + battle.opponent_votes} votes</span>
              {battle.winner_id && (
                <>
                  <span>•</span>
                  <span className="text-gold font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {battle.winner_id === battle.challenger_id ? battle.challenger_username : battle.opponent_username}
                  </span>
                </>
              )}
              {battle.judge_notes && (
                <>
                  <span>•</span>
                  <span>Notes: {battle.judge_notes}</span>
                </>
              )}
            </div>

            {/* ── Scoring Panel ── */}
            {isScoring && (
              <div className="bg-background border border-gold/30 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="w-4 h-4" /> Score & Decide
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-muted-foreground">{battle.challenger_username}</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={scores.challenger}
                      onChange={e => setScores({ ...scores, challenger: Number(e.target.value) })}
                      className="mt-1 bg-surface-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">{battle.opponent_username}</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={scores.opponent}
                      onChange={e => setScores({ ...scores, opponent: Number(e.target.value) })}
                      className="mt-1 bg-surface-1"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Judge notes (optional)..."
                  value={judgeNotes}
                  onChange={e => setJudgeNotes(e.target.value)}
                  className="bg-surface-1"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setScoringBattle(null)}
                    className="flex-1 py-2 bg-surface-1 border border-border rounded text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitScoresAndDecide(battle.id)}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-gold text-background rounded text-xs font-bold disabled:opacity-50"
                  >
                    {isLoading ? "Submitting..." : "Submit & Decide Winner"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex flex-wrap gap-2">
              {/* Score/Judge */}
              {battle.status !== "completed" && battle.status !== "cancelled" && battle.opponent_id && (
                <button
                  onClick={() => {
                    setScoringBattle(battle.id);
                    setScores({ challenger: 50, opponent: 50 });
                    setJudgeNotes("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gold/20 border border-gold/40 text-gold rounded text-[11px] font-semibold hover:bg-gold/30 transition-colors"
                >
                  <Gavel className="w-3.5 h-3.5" /> Score & Judge
                </button>
              )}

              {/* Quick winner pick */}
              {battle.status !== "completed" && battle.status !== "cancelled" && battle.opponent_id && !isScoring && (
                <>
                  <button
                    onClick={() => declareWinner(battle.id, battle.challenger_id, battle.challenger_username)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded text-[11px] font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <Crown className="w-3.5 h-3.5" /> {battle.challenger_username} Wins
                  </button>
                  <button
                    onClick={() => declareWinner(battle.id, battle.opponent_id!, battle.opponent_username!)}
                    disabled={isLoading || !battle.opponent_id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded text-[11px] font-semibold hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                  >
                    <Crown className="w-3.5 h-3.5" /> {battle.opponent_username} Wins
                  </button>
                </>
              )}

              {/* Force status changes */}
              {battle.status === "pending" && battle.opponent_id && (
                <button
                  onClick={() => forceStatus(battle.id, "active")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded text-[11px] font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Force Start
                </button>
              )}

              {battle.status === "active" && (
                <button
                  onClick={() => forceStatus(battle.id, "judging")}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded text-[11px] font-semibold hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                >
                  <SkipForward className="w-3.5 h-3.5" /> → Judging
                </button>
              )}

              {/* Cancel */}
              {battle.status !== "completed" && battle.status !== "cancelled" && (
                <button
                  onClick={() => cancelBattle(battle.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border border-border text-muted-foreground rounded text-[11px] font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Swords className="w-4 h-4 text-red-400" />
          1v1 Battles
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{battles.length} total</span>
          <button onClick={fetchBattles} className="p-1.5 hover:bg-surface-1 rounded transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username, ID, or status..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 bg-surface-1 border-border text-sm"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Active", count: byStatus(["active"]).length, color: "text-red-400" },
          { label: "Judging", count: byStatus(["judging"]).length, color: "text-purple-400" },
          { label: "Open", count: byStatus(["pending"]).length, color: "text-amber-400" },
          { label: "Done", count: byStatus(["completed"]).length, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-surface-1 border border-border rounded-lg p-2 text-center">
            <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
            <span className="text-[9px] text-muted-foreground block uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-3">
          <TabsTrigger value="active" className="text-xs">Active ({activeBattles.length})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Open ({pendingBattles.length})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done ({completedBattles.length})</TabsTrigger>
          <TabsTrigger value="other" className="text-xs">Other ({otherBattles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-2">
          {activeBattles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No active battles</p>
          ) : activeBattles.map(renderBattle)}
        </TabsContent>

        <TabsContent value="pending" className="space-y-2">
          {pendingBattles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No open battles</p>
          ) : pendingBattles.map(renderBattle)}
        </TabsContent>

        <TabsContent value="completed" className="space-y-2">
          {completedBattles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No completed battles</p>
          ) : completedBattles.map(renderBattle)}
        </TabsContent>

        <TabsContent value="other" className="space-y-2">
          {otherBattles.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">None</p>
          ) : otherBattles.map(renderBattle)}
        </TabsContent>
      </Tabs>
    </section>
  );
}
