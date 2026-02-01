import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PremiumStep, usePendingHostedCompetitions } from "@/hooks/useHostedCompetitions";

interface PremiumStepsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionName: string;
  currentSteps: PremiumStep[];
  onUpdated: () => void;
}

export default function PremiumStepsEditorModal({ 
  isOpen, 
  onClose, 
  competitionId, 
  competitionName,
  currentSteps,
  onUpdated 
}: PremiumStepsEditorModalProps) {
  const { updatePremiumSteps } = usePendingHostedCompetitions();
  const [steps, setSteps] = useState<PremiumStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize with current steps or default template
      if (currentSteps.length > 0) {
        setSteps(currentSteps);
      } else {
        setSteps([
          { title: "Join the Competition", description: "Click the join button to register for this comp" },
          { title: "Create Your Edit", description: "Follow the theme and guidelines to create your entry" },
          { title: "Submit Before Deadline", description: "Upload your edit to TikTok/Instagram/YouTube and submit the link" }
        ]);
      }
    }
  }, [isOpen, currentSteps]);

  const addStep = () => {
    setSteps([...steps, { title: "", description: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    // Filter out empty steps
    const validSteps = steps.filter(s => s.title.trim() && s.description.trim());
    if (validSteps.length === 0) {
      return;
    }

    setIsSaving(true);
    await updatePremiumSteps(competitionId, validSteps);
    setIsSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            Edit Premium Steps
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{competitionName}</p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-xs text-muted-foreground">
            Define step-by-step instructions that will guide editors through the entry process.
          </p>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-1 border border-border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">{index + 1}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                  </div>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(index)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                  placeholder="Step title..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(index, 'description', e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </motion.div>
            ))}
          </div>

          {/* Add Step Button */}
          {steps.length < 5 && (
            <button
              onClick={addStep}
              className="w-full py-2 border border-dashed border-purple-500/40 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || steps.every(s => !s.title.trim())}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Steps
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
