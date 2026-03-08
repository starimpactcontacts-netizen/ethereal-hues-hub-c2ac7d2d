/**
 * TournamentProposalsAdmin — Review sanctioned + monetized tournament proposals from unit owners
 */
import { useState, useEffect, useCallback } from "react";
import { Trophy, DollarSign, Check, X, Clock, Users, Eye, Shield, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TournamentProposal {
  id: string;
  name: string;
  description: string | null;
  crew_id: string;
  crew_name?: string;
  host_id: string;
  host_username?: string;
  status: string;
  prize_pool: string | null;
  max_players: number;
  min_players: number;
  created_at: string;
  type: 'sanctioned' | 'monetized';
  // monetized fields
  entry_fee_cents?: number;
  host_earnings_cents?: number;
  view_count?: number;
}

export default function TournamentProposalsAdmin() {
  const [proposals, setProposals] = useState<TournamentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      // Fetch pending sanctioned tournaments
      const { data: sanctioned } = await supabase
        .from("sanctioned_tournaments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // Fetch pending hosted competitions
      const { data: hosted } = await supabase
        .from("hosted_competitions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const allProposals: TournamentProposal[] = [];

      // Map sanctioned
      if (sanctioned) {
        const crewIds = [...new Set(sanctioned.map((t: any) => t.crew_id).filter(Boolean))];
        const hostIds = [...new Set(sanctioned.map((t: any) => t.host_id).filter(Boolean))];
        
        const [{ data: crews }, { data: hosts }] = await Promise.all([
          crewIds.length > 0 ? supabase.from("crews").select("id, name").in("id", crewIds) : { data: [] },
          hostIds.length > 0 ? supabase.from("profiles").select("id, username").in("id", hostIds) : { data: [] },
        ]);

        const crewMap = new Map((crews || []).map((c: any) => [c.id, c.name]));
        const hostMap = new Map((hosts || []).map((h: any) => [h.id, h.username]));

        sanctioned.forEach((t: any) => {
          allProposals.push({
            id: t.id,
            name: t.name,
            description: t.description,
            crew_id: t.crew_id,
            crew_name: crewMap.get(t.crew_id) || "Unknown Unit",
            host_id: t.host_id,
            host_username: hostMap.get(t.host_id) || "Unknown",
            status: t.status,
            prize_pool: t.prize_pool,
            max_players: t.max_players || 64,
            min_players: t.min_players || 8,
            created_at: t.created_at,
            type: "sanctioned",
          });
        });
      }

      // Map hosted/monetized
      if (hosted) {
        const hostIds = [...new Set(hosted.map((c: any) => c.host_id).filter(Boolean))];
        const { data: hostProfiles } = hostIds.length > 0
          ? await supabase.from("profiles").select("id, username").in("id", hostIds)
          : { data: [] };
        const hostMap = new Map((hostProfiles || []).map((h: any) => [h.id, h.username]));

        hosted.forEach((c: any) => {
          allProposals.push({
            id: c.id,
            name: c.name,
            description: c.description,
            crew_id: c.crew_id || "",
            crew_name: c.crew_name || "—",
            host_id: c.host_id,
            host_username: hostMap.get(c.host_id) || c.host_username || "Unknown",
            status: c.status,
            prize_pool: null,
            max_players: c.max_participants || 64,
            min_players: c.min_participants || 4,
            created_at: c.created_at,
            type: "monetized",
            entry_fee_cents: c.entry_fee_cents,
            host_earnings_cents: c.host_earnings_cents,
          });
        });
      }

      // Sort by date desc
      allProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProposals(allProposals);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleApprove = async (proposal: TournamentProposal) => {
    setProcessing(proposal.id);
    try {
      const table = proposal.type === "sanctioned" ? "sanctioned_tournaments" : "hosted_competitions";
      const { error } = await supabase
        .from(table)
        .update({ 
          status: "approved",
          ...(adminNotes[proposal.id] ? { admin_notes: adminNotes[proposal.id] } : {}),
        })
        .eq("id", proposal.id);

      if (error) throw error;
      toast.success(`${proposal.type === "sanctioned" ? "Tournament" : "Competition"} approved!`);
      fetchProposals();
    } catch (err) {
      toast.error("Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (proposal: TournamentProposal) => {
    setProcessing(proposal.id);
    try {
      const table = proposal.type === "sanctioned" ? "sanctioned_tournaments" : "hosted_competitions";
      const { error } = await supabase
        .from(table)
        .update({ 
          status: "rejected",
          ...(adminNotes[proposal.id] ? { admin_notes: adminNotes[proposal.id] } : {}),
        })
        .eq("id", proposal.id);

      if (error) throw error;
      toast.success("Proposal rejected");
      fetchProposals();
    } catch (err) {
      toast.error("Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-muted/50 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const pending = proposals.filter(p => p.status === "pending");

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Trophy size={14} className="text-primary" />
          Tournament Proposals
        </h2>
        <span className="text-xs text-primary font-semibold">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No pending tournament proposals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((proposal) => {
            const isExpanded = expandedId === proposal.id;
            const isSanctioned = proposal.type === "sanctioned";
            
            return (
              <div key={proposal.id} className={`bg-card border rounded-lg overflow-hidden ${
                isSanctioned ? "border-primary/30" : "border-emerald-500/30"
              }`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{proposal.name}</h3>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isSanctioned
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {isSanctioned ? "Sanctioned" : "Monetized"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield size={10} />
                          {proposal.crew_name}
                        </span>
                        <span>by @{proposal.host_username}</span>
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {proposal.min_players}-{proposal.max_players}
                        </span>
                        {proposal.prize_pool && (
                          <span className="text-primary font-semibold">{proposal.prize_pool}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        <Clock size={10} className="inline mr-1" />
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                      className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/10 space-y-3">
                    {proposal.description && (
                      <p className="text-xs text-muted-foreground">{proposal.description}</p>
                    )}
                    {!isSanctioned && proposal.entry_fee_cents !== undefined && (
                      <div className="flex gap-4 text-xs">
                        <span>Entry Fee: <strong className="text-emerald-400">${(proposal.entry_fee_cents / 100).toFixed(2)}</strong></span>
                      </div>
                    )}
                    <Textarea
                      placeholder="Admin notes (optional)..."
                      value={adminNotes[proposal.id] || ""}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [proposal.id]: e.target.value })}
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(proposal)}
                        disabled={processing === proposal.id}
                        className="flex-1 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(proposal)}
                        disabled={processing === proposal.id}
                        className="flex-1 py-2.5 bg-destructive/20 border border-destructive/40 text-destructive text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
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
