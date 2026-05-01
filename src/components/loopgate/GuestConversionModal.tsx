import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, Sparkles, X, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };

interface Props {
  open: boolean;
  onClose: () => void;
  xpEarned?: number;
  headline?: string;
}

/**
 * Pops after a guest's first competition result.
 * Lets them set a password (and optionally email) to lock in their XP/rank.
 * Same auth.users row is upgraded — no data migration needed.
 */
export default function GuestConversionModal({ open, onClose, xpEarned, headline }: Props) {
  const { convertGuestAccount, markPasswordPrompted, profile } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) markPasswordPrompted();
  }, [open]);

  const handleSave = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email or leave it blank");
      return;
    }
    setLoading(true);
    const { error } = await convertGuestAccount(password, email || undefined);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Couldn't save your account");
      return;
    }
    toast.success("Account saved 🔥 Your progress is locked in.");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] rounded-3xl overflow-hidden bg-[#0F0F11] border border-white/10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/60 active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-7 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#D4A857]" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4A857]" style={teko}>
                  Save Your Progress
                </span>
              </div>
              <h2 className="text-white text-[28px] leading-[1.05] font-black tracking-tight" style={teko}>
                {headline || (xpEarned ? `You earned ${xpEarned} XP!` : "Lock in your run")}
              </h2>
              <p className="text-white/55 text-[13px] mt-2 leading-snug">
                Set a password so <span className="text-white font-semibold">@{profile?.username}</span> keeps your XP, rank, and history. Clear cookies = lose it all.
              </p>

              <div className="mt-5 space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password"
                    autoFocus
                    className="h-14 pl-11 pr-12 rounded-2xl border-0 text-[16px] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                    style={{ background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center text-white/55"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional, for recovery)"
                    autoCapitalize="none"
                    className="h-12 pl-11 pr-4 rounded-2xl border-0 text-[14px] text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#D4A857]"
                    style={{ background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading || password.length < 6}
                className="mt-5 w-full h-14 rounded-2xl text-[16px] font-bold tracking-tight flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: password.length >= 6
                    ? "linear-gradient(180deg, #E8C271 0%, #C99A45 100%)"
                    : "rgba(255,255,255,0.08)",
                  color: password.length >= 6 ? "#1a1306" : "rgba(255,255,255,0.5)",
                  boxShadow: password.length >= 6 ? "0 10px 30px -8px rgba(212,168,87,0.55), inset 0 1px 0 rgba(255,255,255,0.4)" : "none",
                }}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : "Save my account"}
              </button>

              <button
                onClick={onClose}
                className="w-full mt-2 text-[12px] text-white/40 active:text-white/70 py-2"
              >
                Maybe later — keep playing
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
