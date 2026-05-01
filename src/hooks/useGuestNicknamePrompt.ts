import { create } from 'zustand';

interface State {
  open: boolean;
  reason?: string;
  returnTo?: string;
  prompt: (opts?: { reason?: string; returnTo?: string }) => void;
  close: () => void;
}

/**
 * Global trigger for the lightweight "pick a nickname to enter" modal.
 * Fires automatically 10s after a guest lands, OR immediately when a guest
 * clicks any action that requires an account (quick fight, vote, submit, etc).
 */
export const useGuestNicknamePrompt = create<State>((set) => ({
  open: false,
  reason: undefined,
  returnTo: undefined,
  prompt: (opts) =>
    set({ open: true, reason: opts?.reason, returnTo: opts?.returnTo }),
  close: () => set({ open: false }),
}));