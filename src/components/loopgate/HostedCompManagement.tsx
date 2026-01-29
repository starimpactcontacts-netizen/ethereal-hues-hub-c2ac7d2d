import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, Check, X, Loader2, Calendar, Users, 
  ChevronDown, ChevronUp, ExternalLink, Trophy
} from "lucide-react";
import { usePendingHostedCompetitions, HostedCompetition } from "@/hooks/useHostedCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

function PendingCompCard({ 
  comp, 
  onApprove, 
  onReject 
}: { 
  comp: HostedCompetition; 
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove();
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsProcessing(true);
    await onReject(rejectReason.trim());
    setIsProcessing(false);
  };

  return (
    <div className="bg-surface-1 border border-cyan-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-2/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
          {comp.host_avatar_url ? (
            <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Globe className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{comp.name}</p>
          <p className="text-xs text-muted-foreground">by {comp.host_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase font-bold">
            Pending
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Description */}
          {comp.description && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{comp.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-[9px] uppercase text-muted-foreground">Format</p>
              <p className="text-sm font-medium capitalize">{comp.format.replace('_', ' ')}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-[9px] uppercase text-muted-foreground">Max Entries</p>
              <p className="text-sm font-medium">{comp.max_submissions || 'Unlimited'}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-[9px] uppercase text-muted-foreground">Deadline</p>
              <p className="text-sm font-medium">{format(new Date(comp.submission_deadline), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-[9px] uppercase text-muted-foreground">Prize</p>
              <p className="text-sm font-medium truncate">{comp.prize_description || 'None specified'}</p>
            </div>
          </div>

          {/* Submitted */}
          <p className="text-[10px] text-muted-foreground">
            Submitted {format(new Date(comp.created_at), 'MMM d, yyyy h:mm a')}
          </p>

          {/* Reject Input */}
          {showRejectInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {showRejectInput ? (
              <>
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectReason("");
                  }}
                  className="flex-1 py-2 bg-surface-2 text-foreground font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="flex-1 py-2 bg-destructive text-destructive-foreground font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Confirm Reject
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-surface-2 text-foreground font-medium rounded-lg text-sm hover:bg-destructive/20 hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-green-500 text-background font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HostedCompManagement() {
  const { user } = useAuth();
  const { pending, loading, approveCompetition, rejectCompetition } = usePendingHostedCompetitions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Hosted Comp Proposals
        </h2>
        <span className="text-sm text-muted-foreground">
          {pending.length} pending
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="bg-surface-1 border border-border rounded-lg p-6 text-center">
          <Globe className="w-10 h-10 text-cyan-500/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No pending proposals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((comp) => (
            <PendingCompCard
              key={comp.id}
              comp={comp}
              onApprove={() => user && approveCompetition(comp.id, user.id)}
              onReject={(reason) => rejectCompetition(comp.id, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
