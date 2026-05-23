import { useState } from "react";
import { Flag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ReportContext = "battle" | "competition" | "submission" | "profile" | "chat" | "other";
type ReportReason = "cheating" | "toxicity" | "harassment" | "spam" | "impersonation" | "inappropriate_content" | "other";

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: "cheating",             label: "Cheating",        hint: "Stolen edit, fake submission, multi-account" },
  { value: "toxicity",             label: "Toxicity",        hint: "Insults, hostile behavior" },
  { value: "harassment",           label: "Harassment",      hint: "Targeted abuse or threats" },
  { value: "spam",                 label: "Spam",            hint: "Self-promo, link bait" },
  { value: "impersonation",        label: "Impersonation",   hint: "Pretending to be someone else" },
  { value: "inappropriate_content",label: "Inappropriate",   hint: "NSFW or graphic content" },
  { value: "other",                label: "Other",           hint: "Something else" },
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

  if (!user || !userId || user.id === userId) return null;

  const close = () => {
    setOpen(false);
    setDetails("");
    setReason("toxicity");
  };

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
      close();
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
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
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

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-[#0c0c0c] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Flag size={15} className="text-red-400" />
                <h2 className="text-[16px] font-black uppercase tracking-wide text-white leading-none">
                  Report {username ? `@${username}` : "user"}
                </h2>
              </div>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            <p className="px-5 pb-3 text-[11px] text-white/45 leading-relaxed shrink-0">
              Reports go directly to moderation. False reports will be sanctioned.
            </p>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
              {/* Reason selector */}
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      reason === r.value
                        ? "bg-red-500/15 border-red-500/40"
                        : "bg-white/[0.03] border-white/8 hover:bg-white/[0.06] hover:border-white/15"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      reason === r.value ? "border-red-400" : "border-white/25"
                    }`}>
                      {reason === r.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-bold leading-none ${reason === r.value ? "text-white" : "text-white/70"}`}>
                        {r.label}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{r.hint}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Details textarea */}
              <div>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Add context (optional) — what happened, links, screenshots…"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-white/25 transition-colors"
                />
                <p className="text-[10px] text-white/25 text-right mt-1">{details.length}/2000</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={close}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-[12px] font-bold uppercase tracking-wide text-white/50 hover:text-white hover:border-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[12px] font-black uppercase tracking-wide hover:bg-red-400 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
