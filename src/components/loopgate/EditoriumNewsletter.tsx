import { useState } from "react";
import { Mail, Check, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import editoriumLogo from "@/assets/editorium-logo.png";

interface EditoriumNewsletterProps {
  variant: "sticky" | "inline";
}

export default function EditoriumNewsletter({ variant }: EditoriumNewsletterProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === "loading") return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Enter a valid email address");
      return;
    }

    setState("loading");

    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .insert({ email: email.trim().toLowerCase(), source: "editorium" } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("You're already subscribed!");
        setState("done");
      } else {
        toast.error("Something went wrong. Try again.");
        setState("idle");
      }
      return;
    }

    setState("done");
    toast.success("You're in! Welcome to the Editorium briefing.");
  };

  if (variant === "sticky") {
    return (
      <AnimatePresence>
        {state !== "done" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
            style={{ background: "#111", borderTop: "2px solid #cc0000" }}
          >
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
              <Mail className="w-4 h-4 shrink-0" style={{ color: "#cc0000" }} />
              <span style={{ fontSize: "12px", color: "#ccc", fontWeight: 500, whiteSpace: "nowrap" }}>
                Daily editing news
              </span>
              <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 h-8 px-3 rounded-none text-xs outline-none"
                  style={{
                    background: "#222",
                    border: "1px solid #333",
                    color: "#fff",
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="h-8 px-4 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: "#cc0000", color: "#fff" }}
                >
                  {state === "loading" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Subscribe <ArrowRight className="w-3 h-3" /></>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline variant — appears after article content
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="my-12 p-6 sm:p-8 text-center"
      style={{ border: "2px solid #111", backgroundColor: "#fafafa" }}
    >
      <img
        src={editoriumLogo}
        alt="Editorium"
        className="h-5 mx-auto mb-4"
        style={{ filter: "invert(1)", opacity: 0.6 }}
      />
      <h3
        className="font-display text-xl sm:text-2xl mb-2"
        style={{ color: "#111" }}
      >
        Stay in the cut
      </h3>
      <p style={{ fontSize: "13px", color: "#666", maxWidth: 380, margin: "0 auto 16px" }}>
        Get the daily Editorium briefing — editing culture, artist features, competition news, and community drops. Straight to your inbox.
      </p>

      {state === "done" ? (
        <div className="flex items-center justify-center gap-2" style={{ color: "#cc0000" }}>
          <Check className="w-5 h-5" />
          <span className="font-semibold text-sm">You're subscribed!</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 h-10 px-4 text-sm outline-none"
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              color: "#111",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="h-10 px-5 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "#111",
              color: "#fff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {state === "loading" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>Subscribe</>
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}
