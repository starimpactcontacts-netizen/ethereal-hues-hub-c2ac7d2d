import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { createPortal } from "react-dom";
import ScenepackVote from "./ScenepackVote";

interface Props {
  battleId: string;
  isCash?: boolean;
  kind?: 'battle' | 'cash' | 'quick_fight';
  isParticipant: boolean;
  optionAId: string | null;
  optionBId: string | null;
  voteDeadline: string | null;
  myVote: string | null;
  opponentVote: string | null;
  lockedId: string | null;
  lockedYoutube?: string | null;
  lockedGdrive?: string | null;
  onChanged?: () => void;
  onCancel?: () => void;
}

/**
 * Full-screen game-style scenepack vote modal.
 * Auto-opens when entering a battle with an active scenepack vote.
 * Stays open until the scenepack is locked (then user can dismiss to start editing).
 */
export default function ScenepackVoteModal(props: Props) {
  const [open, setOpen] = useState(true);

  // Reopen if a new vote starts
  useEffect(() => {
    if (props.optionAId && props.optionBId && !props.lockedId) {
      setOpen(true);
    }
  }, [props.optionAId, props.optionBId, props.lockedId]);

  if (!props.optionAId || !props.optionBId) return null;
  if (!open) return null;

  const close = () => {
    setOpen(false);
    props.onCancel?.();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="scenepack-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
        style={{
          background: "radial-gradient(ellipse at center, rgba(20,20,30,0.92) 0%, rgba(0,0,0,0.98) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.94, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="w-full max-w-md flex flex-col gap-3"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-1">
            <p className="text-[10px] uppercase tracking-[0.32em] text-amber-400 font-bold mb-1">
              {props.lockedId ? "Scenepack Locked" : "Choose Your Battlefield"}
            </p>
            <h2
              className="text-3xl font-black text-white"
              style={{ fontFamily: "Teko, sans-serif", letterSpacing: "0.04em" }}
            >
              {props.lockedId ? "READY TO EDIT" : "SCENEPACK VOTE"}
            </h2>
            {!props.lockedId && (
              <p className="text-[11px] text-zinc-400 mt-1">
                Both editors pick. Tie = coin flip.
              </p>
            )}
          </div>

          {/* Vote panel */}
          <ScenepackVote {...props} />

          {/* Post-lock guidance */}
          {props.lockedId && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3 text-center">
              <Download className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Download the scenepack above and start editing in whatever software you usually use.
                Submit your final edit before the timer ends.
              </p>
            </div>
          )}

          {/* Cancel / dismiss button */}
          <button
            onClick={close}
            className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.10] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <X className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
              {props.lockedId ? "Start Editing" : "Cancel"}
            </span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
