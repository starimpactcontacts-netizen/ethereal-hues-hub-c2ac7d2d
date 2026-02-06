import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Check, X, Clock, ChevronRight, Plus, ExternalLink, Star, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCrewEditorSystem, EditorTier, EditorApplication } from "@/hooks/useCrewEditorSystem";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface UnitApplicationsTabProps {
  crewId: string;
  isOfficer: boolean;
}

export default function UnitApplicationsTab({ crewId, isOfficer }: UnitApplicationsTabProps) {
  const { user } = useAuth();
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
  const [platform, setPlatform] = useState("tiktok");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      setMessage("");
    }
  };

  const handleReview = async (appId: string, status: "approved" | "rejected") => {
    await reviewApplication(appId, status);
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

  const TIER_ICONS = ["⭐", "🌟", "💎", "👑", "🔥", "⚡", "🏆", "✨", "🎯", "💀"];

  return (
    <div className="space-y-6 pb-20">
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
            <Sparkles className="w-5 h-5 text-purple-400" />
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
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && selectedTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">{selectedTier.icon}</span>
                Apply for {selectedTier.name}
              </h3>

              {selectedTier.requirements && (
                <div className="mb-4 text-sm bg-muted/30 rounded-lg p-3">
                  <p className="font-medium mb-1">Requirements:</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedTier.requirements}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="streamable">Streamable</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Submission URL</label>
                  <Input
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Message (optional)</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
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
                    className="flex-1"
                    style={{ backgroundColor: selectedTier.color }}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Editor Modal */}
      <AnimatePresence>
        {showTierEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowTierEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                {editingTier ? "Edit Tier" : "Create Tier"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tier Name</label>
                  <Input
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="e.g., Phase, Nexus, Apex"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Input
                    value={tierDescription}
                    onChange={(e) => setTierDescription(e.target.value)}
                    placeholder="Short description of this tier"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {TIER_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setTierIcon(icon)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          tierIcon === icon
                            ? "bg-gold/20 ring-2 ring-gold"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tierColor}
                      onChange={(e) => setTierColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={tierColor}
                      onChange={(e) => setTierColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Requirements</label>
                  <Textarea
                    value={tierRequirements}
                    onChange={(e) => setTierRequirements(e.target.value)}
                    placeholder="1. Edit must be 10+ seconds&#10;2. No remakes/scraps&#10;3. Must be recent work"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Perks</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newPerk}
                      onChange={(e) => setNewPerk(e.target.value)}
                      placeholder="Add a perk..."
                      onKeyDown={(e) => e.key === "Enter" && addPerk()}
                    />
                    <Button onClick={addPerk} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tierPerks.map((perk, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/20"
                        onClick={() => removePerk(i)}
                      >
                        {perk} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {editingTier && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        await deleteTier(editingTier.id);
                        setShowTierEditor(false);
                        resetTierForm();
                      }}
                    >
                      Delete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTierEditor(false);
                      resetTierForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTier}
                    disabled={!tierName}
                    className="flex-1 bg-gold text-black hover:bg-gold/90"
                  >
                    {editingTier ? "Save Changes" : "Create Tier"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
