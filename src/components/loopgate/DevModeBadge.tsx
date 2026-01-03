import { isDevMode } from './ProtectedRoute';

export default function DevModeBadge() {
  if (!isDevMode()) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] bg-amber-500/90 text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg pointer-events-none">
      DEV MODE — Auth Bypassed
    </div>
  );
}
