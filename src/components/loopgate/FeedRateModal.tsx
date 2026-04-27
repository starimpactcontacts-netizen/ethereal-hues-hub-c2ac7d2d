import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FeedRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  username?: string;
  onRated?: () => void;
}

const LABELS: Record<number, string> = {
  1: 'unwatchable', 2: 'rough', 3: 'meh', 4: 'mid', 5: 'decent',
  6: 'solid', 7: 'fire', 8: 'elite', 9: 'insane', 10: 'masterpiece',
};

export default function FeedRateModal({ isOpen, onClose, postId, username, onRated }: FeedRateModalProps) {
  const { user } = useAuth();
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!user) { toast.error('Sign in to rate'); return; }
    if (score == null) return;
    setSending(true);
    try {
      const content = `⭐ Rated ${score}/10 — ${LABELS[score]}${note.trim() ? ` · ${note.trim()}` : ''}`;
      const { error } = await supabase.from('feed_comments').insert({
        submission_id: postId,
        submission_type: 'feed_post',
        user_id: user.id,
        content,
      });
      if (error) throw error;
      toast.success(`You rated ${score}/10`);
      setScore(null); setNote('');
      onRated?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit rating');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-gold" />
                <h2 className="font-display text-lg">Rate this edit{username ? ` · @${username}` : ''}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-1 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Your score</span>
                  <span className="text-xs text-muted-foreground">{score ? `${score}/10 · ${LABELS[score]}` : 'tap a number'}</span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(n)}
                      className={`aspect-square rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                        score === n
                          ? 'bg-gold text-black border-gold'
                          : 'bg-surface-1 border-border text-foreground hover:border-gold/50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Why? <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="cuts hit, color grade clean..."
                  rows={2}
                  className="w-full bg-surface-1 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold hover:bg-surface-1">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={score == null || sending}
                className="flex-1 h-10 rounded-lg bg-gold text-black text-sm font-bold disabled:opacity-50"
              >
                {sending ? 'Posting...' : 'Post Rating'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}