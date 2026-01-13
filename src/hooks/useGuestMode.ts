import { create } from 'zustand';

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

// Helper to check if action should be blocked
export const blockGuestAction = (isGuest: boolean, message = 'Sign in to continue'): boolean => {
  if (isGuest) {
    // Import toast dynamically to avoid circular deps
    import('sonner').then(({ toast }) => {
      toast.error(message);
    });
    return true;
  }
  return false;
};
