import { useState } from "react";
import { Bug } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import SubmitTicketModal from "./SubmitTicketModal";

/**
 * Floating Action Button for submitting bug reports / feedback.
 * Visible in public/guest mode too — if not signed in, it opens the account prompt.
 */
export default function TicketFAB() {
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const { open: openAccountPrompt } = useAccountPrompt();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user || isGuest) {
      openAccountPrompt("save_score");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed left-4 bottom-20 z-40 w-9 h-9 rounded-full bg-card/80 border border-border/40 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all active:scale-95 backdrop-blur-sm"
        title="Report bug or suggest"
      >
        <Bug size={14} />
      </button>
      <SubmitTicketModal open={open} onOpenChange={setOpen} />
    </>
  );
}
