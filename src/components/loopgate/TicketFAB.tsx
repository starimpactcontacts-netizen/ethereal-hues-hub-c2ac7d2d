import { useState } from "react";
import { Bug } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SubmitTicketModal from "./SubmitTicketModal";

/**
 * Floating Action Button for submitting bug reports / feedback.
 * Renders above the bottom nav on the left side.
 */
export default function TicketFAB() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 bottom-[72px] z-40 w-10 h-10 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all active:scale-95"
        title="Report bug or suggest"
      >
        <Bug size={16} />
      </button>
      <SubmitTicketModal open={open} onOpenChange={setOpen} />
    </>
  );
}
