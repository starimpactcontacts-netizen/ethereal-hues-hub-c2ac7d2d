import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, Check, X, Loader2, Calendar, Users, 
  ChevronDown, ChevronUp, ExternalLink, Trophy, Star, StarOff, Trash2, ImagePlus
} from "lucide-react";
import { usePendingHostedCompetitions, HostedCompetition } from "@/hooks/useHostedCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

function LiveCompCard({ 
  comp, 
  onToggleFeatured,
  onDelete,
  onRefresh
}: { 
  comp: HostedCompetition; 
  onToggleFeatured: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(comp.host_avatar_url || "");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const handleToggle = async () => {
    setIsProcessing(true);
    await onToggleFeatured();
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleSaveAvatar = async () => {
    setIsSavingAvatar(true);
    try {
      const { error } = await supabase
        .from('hosted_competitions')
        .update({ host_avatar_url: avatarUrl || null })
        .eq('id', comp.id);

      if (error) throw error;
      toast.success("Host avatar updated");
      setShowAvatarModal(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error("Failed to update avatar");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <>
      <div className="bg-surface-1 border border-border rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {comp.host_avatar_url ? (
              <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Globe className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{comp.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">by {comp.host_name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                comp.status === 'live' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {comp.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAvatarModal(true)}
            className="p-2 rounded-lg bg-surface-2 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            title="Edit host avatar"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={isProcessing}
            className={`p-2 rounded-lg transition-all ${
              comp.is_featured 
                ? 'bg-gold/20 text-gold hover:bg-gold/30' 
                : 'bg-surface-2 text-muted-foreground hover:text-foreground hover:bg-surface-2/80'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : comp.is_featured ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-lg bg-surface-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Competition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{comp.name}"</span>? 
              This will permanently delete all submissions, messages, and participant data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Edit Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="bg-background border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ImagePlus className="w-5 h-5 text-cyan-400" />
              Edit Host Avatar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a custom profile picture for <span className="text-foreground font-medium">"{comp.name}"</span>
            </p>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="w-8 h-8 text-cyan-400" />
                )}
              </div>
            </div>

            {/* URL Input */}
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm"
            />

            <p className="text-[10px] text-muted-foreground">
              💡 Paste an image URL. Leave empty to use the host's default avatar.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="flex-1 py-2 bg-surface-2 text-foreground font-medium rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar}
                className="flex-1 py-2 bg-cyan-500 text-background font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isSavingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function HostedCompManagement() {
  const { user } = useAuth();
  const { pending, liveComps, loading, approveCompetition, rejectCompetition, toggleFeatured, deleteCompetition, refetch } = usePendingHostedCompetitions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Proposals */}
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

      {/* Feature Toggle for Live Comps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Feature Live Comps
          </h2>
          <span className="text-sm text-muted-foreground">
            {liveComps.filter(c => c.is_featured).length} featured
          </span>
        </div>
        
        <p className="text-[10px] text-muted-foreground">
          Tap the star to feature/unfeature a competition on the Arena page.
        </p>

        {liveComps.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-lg p-6 text-center">
            <Star className="w-10 h-10 text-gold/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No live competitions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liveComps.map((comp) => (
              <LiveCompCard
                key={comp.id}
                comp={comp}
                onToggleFeatured={() => toggleFeatured(comp.id, !!comp.is_featured)}
                onDelete={() => deleteCompetition(comp.id)}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
