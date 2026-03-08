/**
 * TournamentLifecycleAdmin — Manage tournament status transitions, CPM rates, and earnings
 * For admin panel: control the full lifecycle of sanctioned + monetized tournaments
 */
import { useState, useEffect, useCallback } from "react";
import {
  Trophy, DollarSign, Play, Square, Eye, Users, Clock,
  ChevronDown, ChevronUp, Gavel, Check, TrendingUp, Settings, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const teko = { fontFamily: "Teko, sans-serif" };

interface LiveTournament {
  id: string;
  name: string;
  status: string;
  type: "sanctioned" | "monetized";
  crew_name: string;
  player_count: number;
  view_count: number;
  host_earnings_cents: number;
  cpm_rate_cents: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
  submission_deadline?: string;
}

const STATUS_FLOW_SANCTIONED = ["pending", "approved", "live", "submissions", "judging", "completed"];
const STATUS_FLOW_MONETIZED = ["pending", "live", "judging", "completed"];

export default function TournamentLifecycleAdmin() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<LiveTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [cpmInputs, setCpmInputs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"active" | "completed">("active");

  const fetchTournaments = useCallback(async () => {
    try {
      // Fetch sanctioned tournaments (not pending)
      const { data: sanctioned } = await supabase
        .from("sanctioned_tournaments")
        .select("*")
        .not("status", "eq", "pending")
        .order("created_at", { ascending: false });

      // Fetch hosted competitions (not pending)
      const { data: hosted } = await (supabase as any)
        .from("hosted_competitions")
        .select("*")
        .not("status", "eq", "pending")
        .order("created_at", { ascending: false });

      const all: LiveTournament[] = [];

      (sanctioned || []).forEach((t: any) => {
        all.push({
          id: t.id,
          name: t.name,
          status: t.status,
          type: "sanctioned",
          crew_name: t.crew_name || "—",
          player_count: t.player_count || 0,
          view_count: 0,
          host_earnings_cents: 0,
          cpm_rate_cents: 0,
          created_at: t.created_at,
          start_date: t.start_date,
          end_date: t.end_date,
          submission_deadline: t.submission_deadline,
        });
      });

      (hosted || []).forEach((c: any) => {
        all.push({
          id: c.id,
          name: c.name,
          status: c.status,
          type: "monetized",
          crew_name: c.host_name || "—",
          player_count: c.participant_count || 0,
          view_count: c.view_count || 0,
          host_earnings_cents: c.host_earnings_cents || 0,
          cpm_rate_cents: c.cpm_rate_cents || 500,
          created_at: c.created_at,
          submission_deadline: c.submission_deadline,
        });
      });

      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTournaments(all);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const advanceStatus = async (t: LiveTournament) => {
    setProcessing(t.id);
    const flow = t.type === "sanctioned" ? STATUS_FLOW_SANCTIONED : STATUS_FLOW_MONETIZED;
    const currentIndex = flow.indexOf(t.status);
    if (currentIndex < 0 || currentIndex >= flow.length - 1) {
      toast.error("Cannot advance further");
      setProcessing(null);
      return;
    }
    const nextStatus = flow[currentIndex + 1];

    try {
      const table = t.type === "sanctioned" ? "sanctioned_tournaments" : "hosted_competitions";
      const updateData: any = { status: nextStatus };

      // Add lifecycle timestamps
      if (nextStatus === "live") updateData.start_date = new Date().toISOString();
      if (nextStatus === "submissions") updateData.submissions_open_at = new Date().toISOString();
      if (nextStatus === "judging") updateData.judging_open_at = new Date().toISOString();
      if (nextStatus === "completed") {
        updateData.end_date = new Date().toISOString();
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from(table).update(updateData).eq("id", t.id);
      if (error) throw error;
      toast.success(`Advanced to "${nextStatus}"`);
      fetchTournaments();
    } catch (err) {
      toast.error("Failed to advance status");
    } finally {
      setProcessing(null);
    }
  };

  const updateCpmRate = async (t: LiveTournament) => {
    const newRate = parseInt(cpmInputs[t.id] || "");
    if (!newRate || newRate < 0) {
      toast.error("Invalid CPM rate");
      return;
    }
    setProcessing(t.id);
    try {
      const { error } = await (supabase as any)
        .from("hosted_competitions")
        .update({ cpm_rate_cents: newRate })
        .eq("id", t.id);
      if (error) throw error;
      toast.success(`CPM rate set to $${(newRate / 100).toFixed(2)}`);
      fetchTournaments();
    } catch (err) {
      toast.error("Failed to update CPM");
    } finally {
      setProcessing(null);
    }
  };

  const activeTournaments = tournaments.filter(t => !["completed", "rejected"].includes(t.status));
  const completedTournaments = tournaments.filter(t => t.status === "completed");
  const displayed = tab === "active" ? activeTournaments : completedTournaments;

  const totalRevenue = tournaments
    .filter(t => t.type === "monetized")
    .reduce((s, t) => s + t.host_earnings_cents, 0);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/30 rounded-lg" />)}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Revenue Overview */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> Platform Tournament Revenue
            </span>
            <p className="text-3xl font-black text-emerald-400 mt-1" style={teko}>
              ${(totalRevenue / 100).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{activeTournaments.length} active</p>
            <p className="text-xs text-muted-foreground">{completedTournaments.length} completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tab === "active" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
          }`}
        >
          Active ({activeTournaments.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            tab === "completed" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
          }`}
        >
          Completed ({completedTournaments.length})
        </button>
      </div>

      {/* Tournament List */}
      {displayed.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No {tab} tournaments</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(t => {
            const isExpanded = expandedId === t.id;
            const isMon = t.type === "monetized";
            const flow = isMon ? STATUS_FLOW_MONETIZED : STATUS_FLOW_SANCTIONED;
            const currentIdx = flow.indexOf(t.status);
            const canAdvance = currentIdx >= 0 && currentIdx < flow.length - 1;
            const nextStatus = canAdvance ? flow[currentIdx + 1] : null;

            return (
              <div key={t.id} className={`bg-card border rounded-lg overflow-hidden ${
                isMon ? "border-emerald-500/20" : "border-primary/20"
              }`}>
                <div
                  className="p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {isMon ? <DollarSign size={14} className="text-emerald-400 shrink-0" /> : <Trophy size={14} className="text-primary shrink-0" />}
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate">{t.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{t.crew_name}</span>
                          <span className="flex items-center gap-0.5"><Users size={9} /> {t.player_count}</span>
                          {isMon && <span className="flex items-center gap-0.5"><Eye size={9} /> {t.view_count.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        t.status === "live" ? "bg-emerald-500/20 text-emerald-400" :
                        t.status === "judging" ? "bg-amber-500/20 text-amber-400" :
                        t.status === "submissions" ? "bg-blue-500/20 text-blue-400" :
                        t.status === "completed" ? "bg-primary/20 text-primary" :
                        "bg-muted/30 text-muted-foreground"
                      }`}>
                        {t.status}
                      </span>
                      {isMon && (
                        <span className="text-xs font-bold text-emerald-400">
                          ${(t.host_earnings_cents / 100).toFixed(2)}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-3 bg-muted/5 space-y-3">
                    {/* Status Flow Indicator */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {flow.map((status, i) => (
                        <div key={status} className="flex items-center gap-1">
                          <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            i <= currentIdx
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/30 text-muted-foreground"
                          }`}>
                            {status}
                          </span>
                          {i < flow.length - 1 && <span className="text-muted-foreground/30">→</span>}
                        </div>
                      ))}
                    </div>

                    {/* Monetized: CPM Rate Control */}
                    {isMon && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                        <label className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1 mb-2">
                          <Settings size={10} /> CPM Rate (cents per 1K views)
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder={String(t.cpm_rate_cents)}
                            value={cpmInputs[t.id] || ""}
                            onChange={e => setCpmInputs({ ...cpmInputs, [t.id]: e.target.value })}
                            className="text-sm flex-1"
                          />
                          <button
                            onClick={() => updateCpmRate(t)}
                            disabled={processing === t.id}
                            className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                          >
                            Set
                          </button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          Current: ${(t.cpm_rate_cents / 100).toFixed(2)}/1K views → Host earns ${(t.host_earnings_cents / 100).toFixed(2)} from {t.view_count.toLocaleString()} views
                        </p>
                      </div>
                    )}

                    {/* Advance Status */}
                    {canAdvance && (
                      <button
                        onClick={() => advanceStatus(t)}
                        disabled={processing === t.id}
                        className={`w-full py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                          nextStatus === "live" ? "bg-emerald-600 text-white" :
                          nextStatus === "judging" ? "bg-amber-600 text-white" :
                          nextStatus === "completed" ? "bg-primary text-primary-foreground" :
                          "bg-blue-600 text-white"
                        }`}
                      >
                        {nextStatus === "live" && <Play size={14} />}
                        {nextStatus === "judging" && <Gavel size={14} />}
                        {nextStatus === "completed" && <Check size={14} />}
                        {nextStatus === "submissions" && <Zap size={14} />}
                        Advance to "{nextStatus}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
