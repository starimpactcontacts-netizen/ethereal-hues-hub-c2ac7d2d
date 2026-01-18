import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TempProfile {
  username: string;
  avatarUrl?: string;
  region?: string;
  role?: 'editor' | 'judge';
  createdAt?: string;
  inviteCode?: string; // Code they used to join
  pendingCrewId?: string; // Crew to auto-join when verified
}

interface TempProfileState {
  profile: TempProfile | null;
  setProfile: (profile: TempProfile) => void;
  updateProfile: (updates: Partial<TempProfile>) => void;
  clearProfile: () => void;
  isTemp: boolean;
}

// Temporary profile store - persists to localStorage
// Allows users to create identity without email/password
// When they try protected actions, we prompt for account creation
export const useTempProfile = create<TempProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isTemp: false,
      setProfile: (profile) => set({ profile, isTemp: true }),
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),
      clearProfile: () => set({ profile: null, isTemp: false }),
    }),
    {
      name: 'loopgate-temp-profile',
    }
  )
);

// Actions that TRULY require a real account (security-critical only)
export const PROTECTED_ACTIONS = [
  'apply_judge',
  'request_review',
  'save_score',
  'redeem_shop',
  'send_message',
] as const;

export type ProtectedAction = typeof PROTECTED_ACTIONS[number];

// Helper to check if action requires account
export const requiresAccount = (action: ProtectedAction): string => {
  const messages: Record<ProtectedAction, string> = {
    apply_judge: 'Create an account to apply as a judge',
    request_review: 'Create an account to request a review',
    save_score: 'Create an account to save your progress',
    redeem_shop: 'Create an account to redeem items',
    send_message: 'Create an account to send messages',
  };
  return messages[action];
};
