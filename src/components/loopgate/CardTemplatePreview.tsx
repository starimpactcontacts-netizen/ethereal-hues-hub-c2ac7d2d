import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from '@/components/ui/button';
import JudgeReviewCard, { CardTemplate } from './JudgeReviewCard';

interface CardTemplatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES: { id: CardTemplate; label: string; preview: string }[] = [
  { id: 'dark-minimal', label: 'Dark Minimal', preview: '⬛' },
  { id: 'neon', label: 'Neon', preview: '🟣' },
  { id: 'cinematic', label: 'Cinematic', preview: '🎬' },
  { id: 's-class-gold', label: 'S-Class Gold', preview: '👑' },
  { id: 'f-class-red', label: 'F-Class Red', preview: '💀' },
  { id: 'clean-white', label: 'Clean White', preview: '⬜' },
];

// Sample data for preview
const SAMPLE_DATA = {
  editorUsername: 'editor',
  judgeUsername: 'you',
  judgeAvatarUrl: null,
  totalScore: 78,
  emotionScore: 12,
  creativityScore: 20,
  syncScore: 22,
  identityScore: 7,
  executionScore: 17,
  comment: 'Great flow and sync! The transitions hit hard. Work on building more emotional tension.',
};

export default function CardTemplatePreview({ isOpen, onClose }: CardTemplatePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('dark-minimal');

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <GateIcon className="w-5 h-5 text-gold" />
            <div>
              <h2 className="font-display text-lg">Card Templates</h2>
              <p className="text-xs text-muted-foreground">Preview all available review card styles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-1 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Selection */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedTemplate === t.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border hover:border-border/80 bg-surface-0'
                }`}
              >
                <span className="text-xl">{t.preview}</span>
                <p className="text-xs mt-1 text-muted-foreground">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Card Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-center">
            <JudgeReviewCard
              {...SAMPLE_DATA}
              template={selectedTemplate}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <p className="text-xs text-center text-muted-foreground">
            Complete a review to download cards with your scores
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
