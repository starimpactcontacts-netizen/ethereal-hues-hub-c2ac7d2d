import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useGuestNicknamePrompt } from "@/hooks/useGuestNicknamePrompt";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };

/**
 * Lightweight "pick a nickname & enter" modal.
 * Mounted globally; opens via useGuestNicknamePrompt.getState().prompt().
 * Skips entirely when a user is already authenticated.
 */
export default function GuestNicknameModal() {
  const { open, reason, returnTo, close } = useGuestNicknamePrompt();
  const { user, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-close if the user signs in (or already signed in) while the modal is open
  useEffect(() => {
    if (open && user) close();
  }, [open, user, close]);

  if (!open || user) return null;

  const submit = async () => {
    const name = nickname.trim();
    setErr("");
    if (name.length < 3) return setErr("At least 3 characters");
    if (name.length > 20) return setErr("20 characters max");
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return setErr("Letters, numbers, underscores only");

    setLoading(true);
    const { error, usernameTaken } = await signInAsGuest(name);
    setLoading(false);

    if (usernameTaken) {
      setErr("Nickname taken — try another");
      return;
    }
    if (error) {
      toast.error("Could not enter — try again");
      return;
    }
    toast.success(`Welcome, ${name}`);
    close();
    if (returnTo) navigate(returnTo);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="guest-nickname-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={close}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl bg-[#111114] border border-white/10 p-5 shadow-2xl"
        >
          <button
            onClick={close}
            className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.18em]">
              Zero friction
            </span>
          </div>

          <h2 style={teko} className="text-3xl text-white leading-none">
            {reason || "Pick a nickname"}
          </h2>
          <p className="text-xs text-white/55 mt-1.5">
            Jump in instantly. Set a password later to lock in your XP.
          </p>

          <div className="mt-4">
            <Input
              autoFocus
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (err) setErr("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="ViralEditor"
              maxLength={20}
              className="bg-black/40 border-white/15 text-white placeholder:text-white/30 h-11"
            />
            {err && <p className="text-xs text-red-400 mt-1.5">{err}</p>}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 w-full h-11 rounded-xl bg-emerald-500 text-black font-bold text-sm tracking-wide hover:bg-emerald-400 transition disabled:opacity-50"
          >
            {loading ? "ENTERING…" : "ENTER"}
          </button>

          <button
            onClick={() => {
              close();
              navigate("/start?full=1");
            }}
            className="mt-2 w-full text-[11px] text-white/40 hover:text-white/70 transition"
          >
            Already have an account? Sign in
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}