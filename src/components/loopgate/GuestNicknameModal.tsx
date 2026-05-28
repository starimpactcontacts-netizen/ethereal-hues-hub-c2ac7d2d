import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useGuestNicknamePrompt } from "@/hooks/useGuestNicknamePrompt";
import { toast } from "sonner";

const teko = { fontFamily: "Teko, sans-serif" };

export default function GuestNicknameModal() {
  const { open, reason, returnTo, close } = useGuestNicknamePrompt();
  const { user, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (usernameTaken) { setErr("Nickname taken — try another"); return; }
    if (error) { toast.error("Could not enter — try again"); return; }
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
        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={close}
      >
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl bg-[#0f0f11] border border-white/[0.07] p-6 shadow-2xl"
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <h2 style={teko} className="text-[2.2rem] font-black text-white leading-none tracking-wide mb-1">
            {reason || "Pick a name"}
          </h2>
          <p className="text-[12px] text-white/40 leading-relaxed">
            You can set a password later in settings.
          </p>

          <div className="mt-5">
            <Input
              autoFocus
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); if (err) setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="YourName"
              maxLength={20}
              className="bg-white/[0.04] border-white/[0.10] text-white placeholder:text-white/20 h-11 text-sm focus-visible:border-white/30 focus-visible:ring-0"
            />
            {err && <p className="text-[11px] text-red-400 mt-1.5">{err}</p>}
          </div>

          <button
            onClick={submit}
            disabled={loading || !nickname.trim()}
            className="mt-3 w-full h-11 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-white/90 transition disabled:opacity-30"
          >
            {loading ? "Entering…" : "Enter"}
          </button>

          <button
            onClick={() => { close(); navigate("/start?full=1"); }}
            className="mt-3 w-full text-[11px] text-white/30 hover:text-white/60 transition"
          >
            Want a proper account? <span className="underline underline-offset-2">Sign up here</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
