import { useState, useEffect } from "react";
import { X, Lock, Unlock, Eye, MessageSquare, Shield, Users, Crown, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrewChannel } from "@/hooks/useCrewChannels";
import { toast } from "sonner";
import { LoopedX } from "./LoopedX";

interface ChannelPermissionsModalProps {
  channel: CrewChannel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channelId: string, updates: Partial<CrewChannel>) => Promise<boolean>;
  tiers?: { id: string; name: string; tier_order: number; color: string; icon: string }[];
}

export default function ChannelPermissionsModal({
  channel,
  isOpen,
  onClose,
  onSave,
  tiers = [],
}: ChannelPermissionsModalProps) {
  const [isLocked, setIsLocked] = useState(channel.is_locked);
  const [isEditorOnly, setIsEditorOnly] = useState(channel.is_editor_only);
  const [minTierOrder, setMinTierOrder] = useState(channel.min_tier_order);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsLocked(channel.is_locked);
    setIsEditorOnly(channel.is_editor_only);
    setMinTierOrder(channel.min_tier_order);
  }, [channel]);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSave(channel.id, {
      is_locked: isLocked,
      is_editor_only: isEditorOnly,
      min_tier_order: minTierOrder,
    });

    if (success) {
      toast.success("Channel permissions updated");
      onClose();
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-sm">Channel Permissions</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {channel.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <LoopedX className="w-5 h-5" />
              </button>
            </div>

            {/* Permissions */}
            <div className="p-4 space-y-5">
              {/* Lock Channel */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Officer-Only Posting</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Only owners and officers can send messages. Members can still read.
                    </p>
                  </div>
                </div>
                <Switch checked={isLocked} onCheckedChange={setIsLocked} />
              </div>

              {/* Editor Only */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Crown className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Editor-Only Access</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Only verified unit editors can see and post in this channel.
                    </p>
                  </div>
                </div>
                <Switch checked={isEditorOnly} onCheckedChange={setIsEditorOnly} />
              </div>

              {/* Minimum Tier */}
              {isEditorOnly && tiers.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 pl-12">
                    <div>
                      <p className="text-sm font-medium">Minimum Tier</p>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                        Only editors at or above this tier can access.
                      </p>
                      <Select
                        value={String(minTierOrder)}
                        onValueChange={(v) => setMinTierOrder(Number(v))}
                      >
                        <SelectTrigger className="w-48 h-9 text-sm">
                          <SelectValue placeholder="Any tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Tier</SelectItem>
                          {tiers
                            .sort((a, b) => a.tier_order - b.tier_order)
                            .map((tier) => (
                              <SelectItem key={tier.id} value={String(tier.tier_order)}>
                                <span className="flex items-center gap-2">
                                  <span>{tier.icon}</span>
                                  <span style={{ color: tier.color }}>{tier.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Preview */}
              <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Current Access
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {isEditorOnly ? "Editors only" : "All members"} can view
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {isLocked ? "Officers only" : isEditorOnly ? "Editors" : "Everyone"} can post
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
