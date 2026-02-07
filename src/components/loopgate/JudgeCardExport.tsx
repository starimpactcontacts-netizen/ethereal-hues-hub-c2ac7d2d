import { useState, useRef } from 'react';
import { Download, Share2, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import JudgeReviewCard, { CardTemplate, CardDisplayFormat } from './JudgeReviewCard';

interface JudgeCardExportProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    editorUsername: string;
    judgeUsername: string;
    judgeAvatarUrl?: string | null;
    totalScore: number;
    emotionScore: number;
    creativityScore: number;
    syncScore: number;
    identityScore: number;
    executionScore: number;
    comment?: string;
    ratingMode?: string | null;
    selectedTier?: string | null;
  };
  onSubmitToEditor?: () => Promise<void>;
}

const TEMPLATES: { id: CardTemplate; label: string; preview: string }[] = [
  { id: 'dark-minimal', label: 'Dark Minimal', preview: '⬛' },
  { id: 'neon', label: 'Neon', preview: '🟣' },
  { id: 'cinematic', label: 'Cinematic', preview: '🎬' },
  { id: 's-class-gold', label: 'S-Class Gold', preview: '👑' },
  { id: 'f-class-red', label: 'F-Class Red', preview: '💀' },
  { id: 'clean-white', label: 'Clean White', preview: '⬜' },
];

const DISPLAY_FORMATS: { id: CardDisplayFormat; label: string; description: string }[] = [
  { id: 'full', label: 'Full', description: 'Grade + Score + Breakdown' },
  { id: 'verdict', label: 'Verdict', description: 'Grade + Score + Comment' },
  { id: 'compact', label: 'Compact', description: 'Grade + Score only' },
  { id: 'score-only', label: 'Score Only', description: 'Just 60/100' },
  { id: 'class-only', label: 'Class Only', description: 'Just the grade' },
];

export default function JudgeCardExport({ isOpen, onClose, data, onSubmitToEditor }: JudgeCardExportProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('dark-minimal');
  const [selectedFormat, setSelectedFormat] = useState<CardDisplayFormat>('full');
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `loopgate-review-${data.editorUsername}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Card downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download card');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], 'loopgate-review.png', { type: 'image/png' });
        
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Loopgate Review - @${data.editorUsername}`,
            text: `🎬 @${data.editorUsername} scored ${data.totalScore}/100 on Loopgate!\n\nJudged by @${data.judgeUsername}`,
          });
        } else {
          // Fallback - copy text
          const shareText = `🎬 @${data.editorUsername} scored ${data.totalScore}/100 on Loopgate!\n\nJudged by @${data.judgeUsername}\n\nloopgate.io`;
          await navigator.clipboard.writeText(shareText);
          toast.success('Share text copied to clipboard!');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSubmitToEditor = async () => {
    if (!onSubmitToEditor || submitted) return;
    
    setSubmitting(true);
    try {
      await onSubmitToEditor();
      setSubmitted(true);
      toast.success('Review sent to editor! XP awarded to both of you 🎉');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto bg-surface-1 border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Export Review Card</DialogTitle>
        </DialogHeader>

        {/* Template Selection */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Template</p>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-2 rounded-lg border-2 transition-all text-center ${
                  selectedTemplate === t.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border hover:border-border/80 bg-surface-0'
                }`}
              >
                <span className="text-lg">{t.preview}</span>
                <p className="text-[10px] mt-0.5 text-muted-foreground">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Display Format Selection */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Display Format</p>
          <div className="grid grid-cols-2 gap-2">
            {DISPLAY_FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                className={`p-2 rounded-lg border-2 transition-all text-left ${
                  selectedFormat === f.id
                    ? 'border-gold bg-gold/10'
                    : 'border-border hover:border-border/80 bg-surface-0'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Card Preview */}
        <div className="flex justify-center mb-4 overflow-x-auto py-2">
          <JudgeReviewCard
            ref={cardRef}
            {...data}
            template={selectedTemplate}
            displayFormat={selectedFormat}
          />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 bg-gold hover:bg-gold/90 text-black"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Saving...' : 'Download PNG'}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {onSubmitToEditor && (
            <Button
              onClick={handleSubmitToEditor}
              disabled={submitting || submitted}
              className={`w-full ${submitted ? 'bg-green-600 hover:bg-green-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90'}`}
            >
              {submitted ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Sent to Editor!
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {submitting ? 'Sending...' : 'Send to Editor + Award XP'}
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Download the PNG to overlay on your TikTok review video
        </p>
      </DialogContent>
    </Dialog>
  );
}
