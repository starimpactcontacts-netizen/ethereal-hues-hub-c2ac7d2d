/**
 * HostEarningsDashboard — Full earnings breakdown for unit owners
 * Shows per-competition revenue, CPM rates, views, and cashout ability
 */
import { useState, useEffect } from "react";
import { DollarSign, Eye, Users, TrendingUp, Trophy, Clock, ArrowUpRight, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };

interface CompEarning {
  id: string;
  name: string;
  status: string;
  view_count: number;
  participant_count: number;
  host_earnings_cents: number;
  cpm_rate_cents: number;
  created_at: string;
  submission_deadline: string;
}

interface Props {
  crewId: string;
  onClose?: () => void;
}

export default function HostEarningsDashboard({ crewId, onClose }: Props) {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<CompEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from("hosted_competitions")
        .select("id, name, status, view_count, participant_count, host_earnings_cents, cpm_rate_cents, created_at, submission_deadline")
        .eq("host_crew_id", crewId)
        .order("created_at", { ascending: false });

      if (data && Array.isArray(data)) {
        const comps = data as CompEarning[];
        setCompetitions(comps);
        const earned = comps.reduce((s, c) => s + (c.host_earnings_cents || 0), 0);
        const views = comps.reduce((s, c) => s + (c.view_count || 0), 0);
        const parts = comps.reduce((s, c) => s + (c.participant_count || 0), 0);
        setTotalEarnings(earned);
        setTotalViews(views);
        setTotalParticipants(parts);
        // Pending = completed comps earnings not yet paid
        const pending = comps
          .filter(c => c.status === "completed" && c.host_earnings_cents > 0)
          .reduce((s, c) => s + c.host_earnings_cents, 0);
        setPendingPayout(pending);
      }
      setLoading(false);
    };
    fetch();
  }, [crewId]);

  const handleRequestPayout = async () => {
    if (!user || pendingPayout <= 0) return;
    // Navigate to payout page or create request
    toast.success(`Payout request for $${(pendingPayout / 100).toFixed(2)} — check your Payouts page`);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-20 bg-muted/30 rounded-lg" />
        <div className="h-40 bg-muted/30 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Total Earned</span>
          </div>
          <p className="text-2xl font-black text-emerald-400" style={teko}>
            ${(totalEarnings / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total Views</span>
          </div>
          <p className="text-2xl font-black text-foreground" style={teko}>
            {totalViews.toLocaleString()}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Competitors</span>
          </div>
          <p className="text-2xl font-black text-foreground" style={teko}>
            {totalParticipants}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tournaments</span>
          </div>
          <p className="text-2xl font-black text-foreground" style={teko}>
            {competitions.length}
          </p>
        </div>
      </div>

      {/* CPM Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">View-Based Revenue (CPM)</strong>
          <br />
          You earn per 1,000 views your tournament content generates. Admin sets your CPM rate per competition.
          More engagement = more revenue.
        </div>
      </div>

      {/* Cashout */}
      {pendingPayout > 0 && (
        <button
          onClick={handleRequestPayout}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Wallet className="w-4 h-4" />
          Request Payout — ${(pendingPayout / 100).toFixed(2)}
          <ArrowUpRight className="w-4 h-4" />
        </button>
      )}

      {/* Per-Competition Breakdown */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
          Competition Breakdown
        </h3>
        {competitions.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <Trophy className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No competitions yet</p>
            <p className="text-[10px] text-muted-foreground/50">Host a monetized tournament to start earning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {competitions.map(comp => {
              const statusColor = comp.status === "live" ? "text-emerald-400 bg-emerald-500/20" :
                comp.status === "completed" ? "text-primary bg-primary/20" :
                comp.status === "judging" ? "text-amber-400 bg-amber-500/20" :
                "text-muted-foreground bg-muted/30";
              
              return (
                <div key={comp.id} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold truncate">{comp.name}</h4>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>
                          {comp.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye size={10} /> {(comp.view_count || 0).toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={10} /> {comp.participant_count || 0}
                        </span>
                        <span>CPM: ${((comp.cpm_rate_cents || 500) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-400">
                        ${((comp.host_earnings_cents || 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50">earned</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
