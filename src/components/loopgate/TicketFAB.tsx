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
        className="fixed left-4 bottom-20 z-40 w-9 h-9 rounded-full bg-card/80 border border-border/40 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all active:scale-95 backdrop-blur-sm"
        title="Report bug or suggest"
      >
        <Bug size={14} />
      </button>
      <SubmitTicketModal open={open} onOpenChange={setOpen} />
    </>
  );
}
