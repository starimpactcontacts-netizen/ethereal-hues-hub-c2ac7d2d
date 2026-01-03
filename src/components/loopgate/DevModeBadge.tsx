import { isDevMode } from '@/hooks/useAuth';

export default function DevModeBadge() {
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] bg-amber-500/40 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm pointer-events-none">
      DEV MODE — Auth Bypassed
    </div>
  );
}
