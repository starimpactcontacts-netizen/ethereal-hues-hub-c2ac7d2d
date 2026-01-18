import AccountPromptModal from './AccountPromptModal';
import { useAccountPrompt } from '@/hooks/useAccountPrompt';

// Global Account Prompt that renders the modal based on zustand state
export default function GlobalAccountPrompt() {
  const { isOpen, reason, onSuccess, close } = useAccountPrompt();
  
  return (
    <AccountPromptModal
      isOpen={isOpen}
      onClose={close}
      reason={reason}
      onSuccess={onSuccess}
    />
  );
}
