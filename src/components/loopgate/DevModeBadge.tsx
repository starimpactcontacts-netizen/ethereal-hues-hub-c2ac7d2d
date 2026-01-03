import { isDevMode } from './ProtectedRoute';

export default function DevModeBadge() {
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-amber-500/90 text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
      DEV MODE (Auth Bypassed)
    </div>
  );
}
