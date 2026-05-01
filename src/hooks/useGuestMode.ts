import { create } from 'zustand';
import { useGuestNicknamePrompt } from './useGuestNicknamePrompt';

interface GuestModeState {
  isGuest: boolean;
  setGuest: (value: boolean) => void;
  clearGuest: () => void;
}

// Simple in-memory guest mode state - resets on page reload
// This ensures guests can browse but cannot perform any actions
export const useGuestMode = create<GuestModeState>((set) => ({
  isGuest: false,
  setGuest: (value) => set({ isGuest: value }),
  clearGuest: () => set({ isGuest: false }),
}));

// Helper to check if action should be blocked.
// Now opens the lightweight nickname-only modal instead of just toasting,
// so guests can convert in-place without leaving the page.
export const blockGuestAction = (isGuest: boolean, message = 'Pick a nickname to continue'): boolean => {
  if (isGuest) {
    useGuestNicknamePrompt.getState().prompt({ reason: message });
    return true;
  }
  return false;
};
