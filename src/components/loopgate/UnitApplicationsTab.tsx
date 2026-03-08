import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Check, X, Clock, ChevronRight, Plus, ExternalLink, Star, Crown, Shield, Upload, ImagePlus } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCrewEditorSystem, EditorTier, EditorApplication } from "@/hooks/useCrewEditorSystem";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";
import { LoopedX } from "./LoopedX";

interface UnitApplicationsTabProps {
  crewId: string;
  isOfficer: boolean;
}

export default function UnitApplicationsTab({ crewId, isOfficer }: UnitApplicationsTabProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    tiers,
    applications,
    myApplications,
    myEditorStatus,
    submitApplication,
    reviewApplication,
    createTier,
    updateTier,
    deleteTier,
  } = useCrewEditorSystem(crewId);

  const [selectedTier, setSelectedTier] = useState<EditorTier | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showTierEditor, setShowTierEditor] = useState(false);
  const [editingTier, setEditingTier] = useState<EditorTier | null>(null);

  // Application form state
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [softwareUsed, setSoftwareUsed] = useState("");
  const [wantsFeedback, setWantsFeedback] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Tier editor state
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierColor, setTierColor] = useState("#FFD700");
  const [tierIcon, setTierIcon] = useState("⭐");
  const [tierRequirements, setTierRequirements] = useState("");
  const [tierPerks, setTierPerks] = useState<string[]>([]);
  const [newPerk, setNewPerk] = useState("");

  const pendingApplications = applications.filter(a => a.status === "pending");

  const handleApply = async () => {
    if (!selectedTier || !submissionUrl) return;

    setSubmitting(true);
    const result = await submitApplication(selectedTier.id, submissionUrl, platform, message);
    setSubmitting(false);

    if (result) {
      setShowApplyModal(false);
      setSubmissionUrl("");
      setProofUrl("");
      setSoftwareUsed("");
      setWantsFeedback(true);
      setMessage("");
    }
  };

  const handleReview = async (appId: string, status: "approved" | "rejected") => {
    const notes = reviewNotes[appId];
    await reviewApplication(appId, status, notes);
    setReviewNotes((prev) => { const n = { ...prev }; delete n[appId]; return n; });
  };

  const handleSaveTier = async () => {
    if (!tierName) return;

    if (editingTier) {
      await updateTier(editingTier.id, {
        name: tierName,
        description: tierDescription,
        color: tierColor,
        icon: tierIcon,
        requirements: tierRequirements,
        perks: tierPerks,
      });
    } else {
      await createTier({
        name: tierName,
        description: tierDescription,
        color: tierColor,
        icon: tierIcon,
        requirements: tierRequirements,
        perks: tierPerks,
        tier_order: tiers.length + 1,
      });
    }

    setShowTierEditor(false);
    resetTierForm();
  };

  const resetTierForm = () => {
    setTierName("");
    setTierDescription("");
    setTierColor("#FFD700");
    setTierIcon("⭐");
    setTierRequirements("");
    setTierPerks([]);
    setEditingTier(null);
  };

  const openTierEditor = (tier?: EditorTier) => {
    if (tier) {
      setEditingTier(tier);
      setTierName(tier.name);
      setTierDescription(tier.description || "");
      setTierColor(tier.color);
      setTierIcon(tier.icon);
      setTierRequirements(tier.requirements || "");
      setTierPerks(tier.perks);
    } else {
      resetTierForm();
    }
    setShowTierEditor(true);
  };

  const addPerk = () => {
    if (newPerk.trim()) {
      setTierPerks([...tierPerks, newPerk.trim()]);
      setNewPerk("");
    }
  };

  const removePerk = (index: number) => {
    setTierPerks(tierPerks.filter((_, i) => i !== index));
  };

  // TIER_ICONS moved to module-level TIER_ICONS_LIST

  return (
    <div className="space-y-5 pb-20">
      {/* My Editor Status */}
      {myEditorStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gold/20 to-transparent border border-gold/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-xl">
              {myEditorStatus.tier?.icon || "⭐"}
            </div>
            <div>
              <p className="text-gold font-medium">You're a Unit Editor!</p>
              <p className="text-sm text-muted-foreground">
                Tier: {myEditorStatus.tier?.name || "Unknown"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tiers Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Editor Tiers
          </h3>
          {isOfficer && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openTierEditor()}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Tier
            </Button>
          )}
        </div>

        {tiers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No editor tiers set up yet</p>
            {isOfficer && (
              <p className="text-sm mt-1">Create tiers to start accepting applications</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tiers.map((tier, index) => {
              const myApp = myApplications.find(a => a.tier_id === tier.id);
              const hasApplied = !!myApp;
              const isApproved = myEditorStatus?.tier_id === tier.id;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 relative overflow-hidden"
                  style={{ borderColor: `${tier.color}30` }}
                >
                  {/* Tier Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${tier.color}20` }}
                      >
                        {tier.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold" style={{ color: tier.color }}>
                          {tier.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {tier.description || "No description"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : hasApplied ? (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {myApp?.status === "pending" ? "Pending" : myApp?.status}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTier(tier);
                            setShowApplyModal(true);
                          }}
                          disabled={!!myEditorStatus}
                          style={{ backgroundColor: tier.color }}
                          className="text-black font-medium"
                        >
                          Apply
                        </Button>
                      )}

                      {isOfficer && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTierEditor(tier)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Perks */}
                  {tier.perks && tier.perks.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tier.perks.map((perk, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-background/50 text-muted-foreground"
                        >
                          ✓ {perk}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Requirements */}
                  {tier.requirements && (
                    <div className="mt-3 text-sm text-muted-foreground bg-background/50 rounded-lg p-3">
                      <p className="font-medium text-foreground mb-1">Requirements:</p>
                      <p className="whitespace-pre-wrap">{tier.requirements}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Applications (Officer View) */}
      {isOfficer && pendingApplications.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <GateIcon className="w-5 h-5 text-purple-400" />
            Pending Applications
            <Badge variant="secondary">{pendingApplications.length}</Badge>
          </h3>

          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={app.avatar_url || ""} />
                      <AvatarFallback>{app.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{app.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Applying for: {app.tier?.name || "Unknown Tier"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                      onClick={() => handleReview(app.id, "approved")}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      onClick={() => handleReview(app.id, "rejected")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Submission */}
                <a
                  href={app.submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Submission ({app.platform})
                </a>

                {/* Message */}
                {app.message && (
                  <div className="mt-2 text-sm text-muted-foreground bg-background/50 rounded-lg p-3">
                    "{app.message}"
                  </div>
                )}

                {/* Feedback Notes */}
                <div className="mt-3">
                  <Input
                    value={reviewNotes[app.id] || ""}
                    onChange={(e) => setReviewNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    placeholder="Add feedback notes (optional)..."
                    className="h-9 text-sm"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Modal - Mobile-optimized bottom sheet */}
      <AnimatePresence>
        {showApplyModal && selectedTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ y: isMobile ? 200 : 0, scale: isMobile ? 1 : 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: isMobile ? 200 : 0, scale: isMobile ? 1 : 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="sticky top-0 bg-card border-b border-border/50 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-xl">{selectedTier.icon}</span>
                  Apply for {selectedTier.name}
                </h3>
                <button onClick={() => setShowApplyModal(false)} className="p-1.5 rounded-lg hover:bg-muted/50">
                  <LoopedX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {selectedTier.requirements && (
                  <div className="text-sm bg-muted/20 border border-border/50 rounded-lg p-3">
                    <p className="font-medium mb-1 text-xs uppercase tracking-wider text-muted-foreground">Requirements</p>
                    <p className="text-muted-foreground whitespace-pre-wrap text-[13px]">
                      {selectedTier.requirements}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="streamable">Streamable</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Submission URL</label>
                  <Input
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Proof of Edit URL (optional)</label>
                  <Input
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://streamable.com/..."
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">What app do you use?</label>
                  <Input
                    value={softwareUsed}
                    onChange={(e) => setSoftwareUsed(e.target.value)}
                    placeholder="e.g., After Effects, CapCut, InShot"
                    className="h-10"
                  />
                </div>

                <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                  <label className="text-sm font-medium">Do you want feedback?</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWantsFeedback(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${wantsFeedback ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-muted text-muted-foreground'}`}
                    >
                      ✅ Yes
                    </button>
                    <button
                      onClick={() => setWantsFeedback(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!wantsFeedback ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-muted text-muted-foreground'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Message (optional)</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={!submissionUrl || submitting}
                    className="flex-1 text-black font-semibold"
                    style={{ backgroundColor: selectedTier.color }}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Editor Modal - Mobile-optimized */}
      <AnimatePresence>
        {showTierEditor && (
          <TierEditorModal
            isMobile={isMobile}
            editingTier={editingTier}
            tierName={tierName}
            setTierName={setTierName}
            tierDescription={tierDescription}
            setTierDescription={setTierDescription}
            tierIcon={tierIcon}
            setTierIcon={setTierIcon}
            tierColor={tierColor}
            setTierColor={setTierColor}
            tierRequirements={tierRequirements}
            setTierRequirements={setTierRequirements}
            tierPerks={tierPerks}
            newPerk={newPerk}
            setNewPerk={setNewPerk}
            addPerk={addPerk}
            removePerk={removePerk}
            onSave={handleSaveTier}
            onDelete={editingTier ? async () => { await deleteTier(editingTier.id); setShowTierEditor(false); resetTierForm(); } : undefined}
            onClose={() => { setShowTierEditor(false); resetTierForm(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tier Editor Modal (extracted for clarity) ───

const TIER_ICONS_LIST = ["⭐", "🌟", "💎", "👑", "🔥", "⚡", "🏆", "✨", "🎯", "💀"];

interface TierEditorModalProps {
  isMobile: boolean;
  editingTier: EditorTier | null;
  tierName: string; setTierName: (v: string) => void;
  tierDescription: string; setTierDescription: (v: string) => void;
  tierIcon: string; setTierIcon: (v: string) => void;
  tierColor: string; setTierColor: (v: string) => void;
  tierRequirements: string; setTierRequirements: (v: string) => void;
  tierPerks: string[];
  newPerk: string; setNewPerk: (v: string) => void;
  addPerk: () => void;
  removePerk: (i: number) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

function TierEditorModal({
  isMobile, editingTier,
  tierName, setTierName, tierDescription, setTierDescription,
  tierIcon, setTierIcon, tierColor, setTierColor,
  tierRequirements, setTierRequirements,
  tierPerks, newPerk, setNewPerk, addPerk, removePerk,
  onSave, onDelete, onClose,
}: TierEditorModalProps) {
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [customIconPreview, setCustomIconPreview] = useState<string | null>(null);

  const handleIconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomIconPreview(dataUrl);
      // Store as a special marker — the emoji field will hold a data URL
      setTierIcon(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const isCustomIcon = tierIcon.startsWith("data:") || tierIcon.startsWith("http");

  if (isMobile) {
    // Full-screen on mobile
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-0 z-[60] bg-background flex flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Header + Actions */}
        <div className="shrink-0 border-b border-border/50 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold">{editingTier ? "Edit Tier" : "Create Tier"}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 touch-manipulation">
              <LoopedX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs">Delete</Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1 text-xs">Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={!tierName} className="flex-1 bg-gold text-black hover:bg-gold/90 font-semibold text-xs">
              {editingTier ? "Save" : "Create"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <TierEditorForm
            tierName={tierName} setTierName={setTierName}
            tierDescription={tierDescription} setTierDescription={setTierDescription}
            tierIcon={tierIcon} setTierIcon={setTierIcon}
            tierColor={tierColor} setTierColor={setTierColor}
            tierRequirements={tierRequirements} setTierRequirements={setTierRequirements}
            tierPerks={tierPerks} newPerk={newPerk} setNewPerk={setNewPerk}
            addPerk={addPerk} removePerk={removePerk}
            isCustomIcon={isCustomIcon} customIconPreview={customIconPreview}
            iconFileRef={iconFileRef} handleIconFile={handleIconFile}
          />
        </div>
      </motion.div>
    );
  }

  // Desktop: centered modal
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Actions */}
        <div className="shrink-0 border-b border-border/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{editingTier ? "Edit Tier" : "Create Tier"}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50">
              <LoopedX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={onSave} disabled={!tierName} className="flex-1 bg-gold text-black hover:bg-gold/90 font-semibold">
              {editingTier ? "Save" : "Create"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <TierEditorForm
            tierName={tierName} setTierName={setTierName}
            tierDescription={tierDescription} setTierDescription={setTierDescription}
            tierIcon={tierIcon} setTierIcon={setTierIcon}
            tierColor={tierColor} setTierColor={setTierColor}
            tierRequirements={tierRequirements} setTierRequirements={setTierRequirements}
            tierPerks={tierPerks} newPerk={newPerk} setNewPerk={setNewPerk}
            addPerk={addPerk} removePerk={removePerk}
            isCustomIcon={isCustomIcon} customIconPreview={customIconPreview}
            iconFileRef={iconFileRef} handleIconFile={handleIconFile}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Form fields (shared between mobile & desktop) ───

interface TierEditorFormProps {
  tierName: string; setTierName: (v: string) => void;
  tierDescription: string; setTierDescription: (v: string) => void;
  tierIcon: string; setTierIcon: (v: string) => void;
  tierColor: string; setTierColor: (v: string) => void;
  tierRequirements: string; setTierRequirements: (v: string) => void;
  tierPerks: string[];
  newPerk: string; setNewPerk: (v: string) => void;
  addPerk: () => void;
  removePerk: (i: number) => void;
  isCustomIcon: boolean;
  customIconPreview: string | null;
  iconFileRef: React.RefObject<HTMLInputElement>;
  handleIconFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function TierEditorForm({
  tierName, setTierName, tierDescription, setTierDescription,
  tierIcon, setTierIcon, tierColor, setTierColor,
  tierRequirements, setTierRequirements,
  tierPerks, newPerk, setNewPerk, addPerk, removePerk,
  isCustomIcon, customIconPreview, iconFileRef, handleIconFile,
}: TierEditorFormProps) {
  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Tier Name</label>
        <Input value={tierName} onChange={(e) => setTierName(e.target.value)} placeholder="e.g., Phase, Nexus, Apex" className="h-9 text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Description</label>
        <Input value={tierDescription} onChange={(e) => setTierDescription(e.target.value)} placeholder="Short description of this tier" className="h-9 text-sm" />
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Icon</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TIER_ICONS_LIST.map((icon) => (
            <button
              key={icon}
              onClick={() => setTierIcon(icon)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
                tierIcon === icon ? "bg-gold/20 ring-2 ring-gold" : "bg-muted hover:bg-muted/80"
              }`}
            >
              {icon}
            </button>
          ))}

          {/* Custom icon upload button */}
          <input ref={iconFileRef} type="file" accept="image/*" className="hidden" onChange={handleIconFile} />
          <button
            onClick={() => iconFileRef.current?.click()}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all touch-manipulation active:scale-95 border border-dashed ${
              isCustomIcon ? "border-gold bg-gold/20 ring-2 ring-gold" : "border-border bg-muted hover:bg-muted/80"
            }`}
          >
            {isCustomIcon ? (
              <img src={tierIcon} alt="Custom" className="w-6 h-6 rounded object-cover" />
            ) : (
              <ImagePlus className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Tap + to upload a custom icon image</p>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={tierColor} onChange={(e) => setTierColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer" />
          <Input value={tierColor} onChange={(e) => setTierColor(e.target.value)} className="flex-1 h-9 text-sm" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Requirements</label>
        <Textarea
          value={tierRequirements}
          onChange={(e) => setTierRequirements(e.target.value)}
          placeholder="1. Edit must be 10+ seconds&#10;2. No remakes/scraps&#10;3. Must be recent work"
          rows={3}
          className="text-sm"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-1.5 block uppercase tracking-wider text-muted-foreground">Perks</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newPerk}
            onChange={(e) => setNewPerk(e.target.value)}
            placeholder="Add a perk..."
            className="h-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addPerk()}
          />
          <Button onClick={addPerk} size="sm" className="h-9 px-3">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tierPerks.map((perk, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20 touch-manipulation"
              onClick={() => removePerk(i)}
            >
              {perk} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
