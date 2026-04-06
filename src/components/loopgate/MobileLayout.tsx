import { Outlet, useLocation } from "react-router-dom";
import type { CSSProperties } from "react";
import BottomNav from "./BottomNav";
import { getPageSafeFill } from "@/lib/pageSafeFill";

export default function MobileLayout() {
  const location = useLocation();
  const hideNavPaths = ["/admin", "/studio", "/editorium"];
  const showNav = !hideNavPaths.includes(location.pathname);
  const safeFill = getPageSafeFill(location.pathname);
  const shellStyle = {
    '--app-safe-fill': safeFill,
    backgroundColor: 'hsl(var(--app-safe-fill))',
  } as CSSProperties;

  return (
    <div className="fixed inset-0 text-foreground flex flex-col overflow-hidden" style={shellStyle}>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60]" style={{ height: 'env(safe-area-inset-top, 0px)', backgroundColor: 'hsl(var(--app-safe-fill))' }} />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-none" style={{ backgroundColor: 'hsl(var(--app-safe-fill))', paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', WebkitOverflowScrolling: 'touch' }}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
