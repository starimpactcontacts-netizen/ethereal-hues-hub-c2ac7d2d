import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useAccountPrompt } from "@/hooks/useAccountPrompt";
import SubmitTicketModal from "./SubmitTicketModal";
import { create } from "zustand";

// Shared state so LoopyChat can trigger the ticket modal
interface TicketStore {
  open: boolean;
  setOpen: (v: boolean) => void;
}
export const useTicketStore = create<TicketStore>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));

/**
 * Just renders the modal — the button is on the Loopy cat now.
 */
export default function TicketFAB() {
  const { open, setOpen } = useTicketStore();
  return <SubmitTicketModal open={open} onOpenChange={setOpen} />;
}
