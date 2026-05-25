import { useState, useEffect } from "react";
import { Lock, Unlock, Eye, MessageSquare, Shield, Crown, Hash, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrewChannel } from "@/hooks/useCrewChannels";
import { toast } from "sonner";

interface ChannelSettingsPageProps {
  channel: CrewChannel;
  crewId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channelId: string, updates: Partial<CrewChannel>) => Promise<boolean>;
  tiers?: { id: string; name: string; tier_order: number; color: string; icon: string }[];
}

export default function ChannelSettingsPage({
  channel,
  crewId: _crewId,
  isOpen,
  onClose,
  onSave,
  tiers = [],
}: ChannelSettingsPageProps) {
  const [isLocked, setIsLocked] = useState(channel.is_locked);
  const [isEditorOnly, setIsEditorOnly] = useState(channel.is_editor_only);
  const [minTierOrder, setMinTierOrder] = useState(channel.min_tier_order);
  const [saving, setSaving] = useState(false);
  const [showPermissions, setShowPermissions] = useState(true);

  useEffect(() => {
    setIsLocked(channel.is_locked);
    setIsEditorOnly(channel.is_editor_only);
    setMinTierOrder(channel.min_tier_order);
  }, [channel]);

  const handleSaveSettings = async () => {
    setSaving(true);
    const success = await onSave(channel.id, {
      is_locked: isLocked,
      is_editor_only: isEditorOnly,
      min_tier_order: minTierOrder,
    });
    if (success) {
      toast.success("Settings saved");
      onClose();
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/50 transition-colors -ml-0.5 touch-manipulation">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[13px] font-semibold">Channel Settings</h1>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" /> {channel.name}
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-3 py-3 space-y-3 max-w-lg mx-auto">

          {/* ═══ CHANNEL PERMISSIONS ═══ */}
          <div>
            <button onClick={() => setShowPermissions(!showPermissions)} className="w-full flex items-center justify-between py-1.5 touch-manipulation">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[13px] font-semibold">Channel Permissions</span>
              </div>
              {showPermissions ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            <AnimatePresence>
              {showPermissions && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-4 pt-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                          {isLocked ? <Lock className="w-4 h-4 text-orange-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Officer-Only Posting</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Only owners and officers can send messages.</p>
                        </div>
                      </div>
                      <Switch checked={isLocked} onCheckedChange={setIsLocked} />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Crown className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Editor-Only Access</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Only verified unit editors can see and post.</p>
                        </div>
                      </div>
                      <Switch checked={isEditorOnly} onCheckedChange={setIsEditorOnly} />
                    </div>

                    {isEditorOnly && tiers.length > 0 && (
                      <div className="pl-12">
                        <p className="text-sm font-medium">Minimum Tier</p>
                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">Only editors at or above this tier.</p>
                        <Select value={String(minTierOrder)} onValueChange={(v) => setMinTierOrder(Number(v))}>
                          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="Any tier" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any Tier</SelectItem>
                            {tiers.sort((a, b) => a.tier_order - b.tier_order).map((tier) => (
                              <SelectItem key={tier.id} value={String(tier.tier_order)}>
                                <span className="flex items-center gap-2"><span>{tier.icon}</span><span style={{ color: tier.color }}>{tier.name}</span></span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Access</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1"><Eye className="w-3 h-3" />{isEditorOnly ? "Editors only" : "All members"} can view</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-background border border-border flex items-center gap-1"><MessageSquare className="w-3 h-3" />{isLocked ? "Officers only" : isEditorOnly ? "Editors" : "Everyone"} can post</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-2 pb-8">
            <Button onClick={handleSaveSettings} disabled={saving} className="w-full" size="sm">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
