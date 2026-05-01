import { create } from 'zustand';

interface State {
  open: boolean;
  xpEarned?: number;
  headline?: string;
  prompt: (opts?: { xpEarned?: number; headline?: string }) => void;
  close: () => void;
}

/**
 * Global trigger for the guest → real-account conversion modal.
 * Any page can call useGuestConversion.getState().prompt({ xpEarned: 150 })
 * after a meaningful win to nudge the guest to set a password.
 */
export const useGuestConversion = create<State>((set) => ({
  open: false,
  xpEarned: undefined,
  headline: undefined,
  prompt: (opts) => set({ open: true, xpEarned: opts?.xpEarned, headline: opts?.headline }),
  close: () => set({ open: false }),
}));
