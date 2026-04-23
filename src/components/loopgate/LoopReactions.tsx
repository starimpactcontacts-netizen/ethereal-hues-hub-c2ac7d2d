import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Emoji } from "./EmojiPicker";
import EmojiPicker from "./EmojiPicker";
import { ReactionGroup } from "@/hooks/useLoopReactions";

interface LoopReactionsProps {
  reactions: ReactionGroup[];
  onToggle: (emoji: string) => void;
  /** Hide numeric counts (Discord-style) */
  hideCounts?: boolean;
  /** Render the reactions row only (no picker trigger). Picker is controlled externally. */
  rowOnly?: boolean;
}

const QUICK_EMOJIS = ["🔥", "💀", "⚔️", "🎯", "👑", "❤️", "😭", "🐐"];

/**
 * Centered modal reaction picker — works seamlessly on mobile + desktop.
 * Glassy iPhone 17 aesthetic.
 */
export function ReactionPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[121] w-[min(92vw,360px)]"
          >
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-background/85 backdrop-blur-2xl shadow-2xl shadow-black/60">
              {/* Quick row */}
              <div className="px-4 pt-4 pb-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-2 font-semibold">Quick React</p>
                <div className="grid grid-cols-8 gap-1">
                  {QUICK_EMOJIS.map((e) => (
                    <motion.button
                      key={e}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { onSelect(e); onClose(); }}
                      className="aspect-square rounded-xl flex items-center justify-center text-lg hover:bg-white/5 active:bg-white/10 transition-colors"
                    >
                      <Emoji emoji={e} size={22} />
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/5">
                <EmojiPicker
                  onSelect={(emoji) => { onSelect(emoji); onClose(); }}
                  showQuickBar={false}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Compact row showing existing reactions only.
 * Tap an existing reaction to toggle it. New reactions come from the modal trigger
 * rendered by the parent action bar.
 */
export default function LoopReactions({ reactions, onToggle, hideCounts = false }: LoopReactionsProps) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {reactions.map(r => (
        <motion.button
          key={r.emoji}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 ${hideCounts ? 'px-1.5' : 'px-2'} py-0.5 rounded-full text-[11px] font-semibold transition-colors border ${
            r.hasReacted
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-white/[0.04] border-white/10 text-muted-foreground hover:bg-white/[0.08]"
          }`}
        >
          <Emoji emoji={r.emoji} size={14} />
          {!hideCounts && <span>{r.count}</span>}
        </motion.button>
      ))}
    </div>
  );
}

// Re-export quick emojis for use elsewhere
export { QUICK_EMOJIS };
