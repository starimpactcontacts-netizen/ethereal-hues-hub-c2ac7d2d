export default function DevModeBadge() {
  // Check global dev auth flag
  if (typeof window === 'undefined' || !(window as any).__LOOPGATE_DEV_AUTH__) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[100] bg-amber-500/40 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm pointer-events-none">
      DEV MODE — Auth Bypassed
    </div>
  );
}
