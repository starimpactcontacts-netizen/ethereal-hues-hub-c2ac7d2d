import { useState, useRef, useEffect } from "react";
import { SmilePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Emoji } from "./EmojiPicker";
import EmojiPicker from "./EmojiPicker";
import { ReactionGroup } from "@/hooks/useLoopReactions";

interface LoopReactionsProps {
  reactions: ReactionGroup[];
  onToggle: (emoji: string) => void;
}

export default function LoopReactions({ reactions, onToggle }: LoopReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">
      {/* Existing reactions */}
      {reactions.map(r => (
        <motion.button
          key={r.emoji}
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors border ${
            r.hasReacted
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Emoji emoji={r.emoji} size={14} />
          <span>{r.count}</span>
        </motion.button>
      ))}

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-0 mb-2 z-50"
            >
              <EmojiPicker
                onSelect={(emoji) => {
                  onToggle(emoji);
                  setShowPicker(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
