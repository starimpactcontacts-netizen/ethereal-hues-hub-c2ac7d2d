import { create } from 'zustand';
import { ProtectedAction, requiresAccount } from './useTempProfile';

interface AccountPromptState {
  isOpen: boolean;
  reason: string;
  onSuccess?: () => void;
  open: (action: ProtectedAction, onSuccess?: () => void) => void;
  close: () => void;
}

// Global state for the account prompt modal
export const useAccountPrompt = create<AccountPromptState>((set) => ({
  isOpen: false,
  reason: '',
  onSuccess: undefined,
  open: (action, onSuccess) => set({ 
    isOpen: true, 
    reason: requiresAccount(action),
    onSuccess 
  }),
  close: () => set({ isOpen: false, reason: '', onSuccess: undefined }),
}));
