import { useState } from "react";
import { Flag, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ReportContext = "battle" | "competition" | "submission" | "profile" | "chat" | "other";
type ReportReason = "cheating" | "toxicity" | "harassment" | "spam" | "impersonation" | "inappropriate_content" | "other";

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "cheating", label: "Cheating", hint: "Stolen edit, fake submission, multi-account" },
  { value: "toxicity", label: "Toxicity", hint: "Insults, hostile behavior" },
  { value: "harassment", label: "Harassment", hint: "Targeted abuse or threats" },
  { value: "spam", label: "Spam", hint: "Self-promo, link bait" },
  { value: "impersonation", label: "Impersonation", hint: "Pretending to be someone else" },
  { value: "inappropriate_content", label: "Inappropriate", hint: "NSFW or graphic content" },
  { value: "other", label: "Other", hint: "Something else" },
];

interface Props {
  userId: string;
  username?: string | null;
  context: ReportContext;
  contextId?: string | null;
  variant?: "icon" | "text";
  className?: string;
}

export default function ReportUserButton({ userId, username, context, contextId, variant = "icon", className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("toxicity");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Don't render for self or signed-out users
  if (!user || !userId || user.id === userId) return null;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("user_reports").insert({
        reporter_id: user.id,
        reported_user_id: userId,
        reason,
        context,
        context_id: contextId ?? null,
        details: details.trim() || null,
      });
      if (error) {
        if ((error as any).code === "23505") {
          toast.info("You've already reported this user — our team will review it.");
        } else {
          throw error;
        }
      } else {
        toast.success("Report sent. Thanks for keeping the community clean.");
      }
      setOpen(false);
      setDetails("");
      setReason("toxicity");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't send report. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        aria-label={`Report ${username || "user"}`}
        title={`Report ${username || "user"}`}
        className={
          className ||
          (variant === "icon"
            ? "inline-flex items-center justify-center w-7 h-7 rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition"
            : "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/40 hover:text-red-400 transition")
        }
      >
        <Flag size={variant === "icon" ? 13 : 11} />
        {variant === "text" && <span>Report</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-[#111114] border border-white/10 p-5 shadow-2xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Flag size={16} className="text-red-400" />
                <h2 className="font-display text-2xl text-white leading-none">Report {username ? `@${username}` : "user"}</h2>
              </div>
              <p className="text-xs text-white/55 mb-4">
                Reports go straight to moderation. False reports will be sanctioned.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex flex-col items-start text-left px-3 py-2 rounded-lg border text-xs transition ${
                      reason === r.value
                        ? "bg-red-500/15 border-red-500/50 text-white"
                        : "bg-transparent border-white/10 text-white/70 hover:border-white/25"
                    }`}
                  >
                    <span className="font-bold">{r.label}</span>
                    <span className="text-[10px] text-white/40 leading-tight mt-0.5">{r.hint}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Add context (optional) — what happened, links, screenshots…"
                className="w-full bg-black/40 border border-white/15 rounded-lg p-3 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30"
              />
              <div className="text-[10px] text-white/30 mt-1 text-right">{details.length}/2000</div>

              <button
                onClick={submit}
                disabled={submitting}
                className="mt-3 w-full h-11 rounded-xl bg-red-500 text-black font-bold text-sm tracking-wide hover:bg-red-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {submitting ? "SENDING…" : "SEND REPORT"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}