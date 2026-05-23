import { CheckCircle, Clock, AlertCircle, X, ExternalLink, Trophy } from "lucide-react";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending Review", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  scored: { label: "Scored", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  rejected: { label: "Rejected", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export default function MyEventSubmissionsSheet({ open, onClose, eventId, eventTitle }: Props) {
  const { submissions, loading } = useUserSubmissions();
  const mine = submissions.filter((s) => s.event_id === eventId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-background border-t sm:border border-white/10 sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">My Submissions</p>
            <h2 className="text-sm font-bold truncate">{eventTitle}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 active:scale-95">
            <X size={18} className="text-foreground/70" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mine.length === 0 ? (
            <div className="text-center py-10">
              <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">You haven't submitted to this event yet.</p>
            </div>
          ) : (
            mine.map((s) => {
              const status = statusConfig[s.status] || statusConfig.pending;
              const Icon = status.icon;
              return (
                <div key={`${s.source}-${s.id}`} className="bg-surface-1 border border-white/10 rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] text-muted-foreground">
                      {s.submitted_at ? formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true }) : "—"}
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${status.bg}`}>
                      <Icon size={11} className={status.color} />
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${status.color}`}>{status.label}</span>
                    </div>
                  </div>

                  <a
                    href={s.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-gold transition"
                  >
                    <ExternalLink size={11} />
                    <span className="truncate">{s.submission_url}</span>
                  </a>

                  {s.status === "scored" && s.qoi_score != null && (
                    <div className="border-t border-white/10 pt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-base font-bold">{s.quality_score ?? "—"}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Quality</p>
                      </div>
                      <div>
                        <p className="text-base font-bold">{s.originality_score ?? "—"}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Original</p>
                      </div>
                      <div>
                        <p className="text-base font-bold">{s.impact_score ?? "—"}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Impact</p>
                      </div>
                      <div className="bg-gold/10 rounded">
                        <p className="text-base font-bold text-gold">{s.qoi_score.toFixed(1)}</p>
                        <p className="text-[9px] text-gold uppercase tracking-wider">QOI</p>
                      </div>
                    </div>
                  )}

                  {s.final_rank && (
                    <div className="text-center text-[11px]">
                      <span className="text-muted-foreground uppercase tracking-wider">Final Rank: </span>
                      <span className="text-gold font-bold">#{s.final_rank}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}