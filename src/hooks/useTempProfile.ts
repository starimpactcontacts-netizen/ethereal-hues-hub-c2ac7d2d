import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TempProfile {
  username: string;
  avatarUrl?: string;
  region?: string;
  createdAt: string;
}

interface TempProfileState {
  profile: TempProfile | null;
  setProfile: (profile: TempProfile) => void;
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
      clearProfile: () => set({ profile: null, isTemp: false }),
    }),
    {
      name: 'loopgate-temp-profile',
    }
  )
);

// Actions that require a real account
export const PROTECTED_ACTIONS = [
  'submit_edit',
  'join_crew',
  'apply_judge',
  'request_review',
  'enter_arena',
  'save_score',
  'redeem_shop',
  'send_message',
] as const;

export type ProtectedAction = typeof PROTECTED_ACTIONS[number];

// Helper to check if action requires account
export const requiresAccount = (action: ProtectedAction): string => {
  const messages: Record<ProtectedAction, string> = {
    submit_edit: 'Create an account to save your score',
    join_crew: 'Create an account to join a crew',
    apply_judge: 'Create an account to apply as a judge',
    request_review: 'Create an account to request a review',
    enter_arena: 'Create an account to enter the arena',
    save_score: 'Create an account to save your progress',
    redeem_shop: 'Create an account to redeem items',
    send_message: 'Create an account to send messages',
  };
  return messages[action];
};
