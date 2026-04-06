import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function MobileLayout() {
  const location = useLocation();
  const hideNavPaths = ["/admin", "/studio", "/editorium"];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#000000' }}>
      <div className="shrink-0" style={{ height: 'env(safe-area-inset-top, 0px)', backgroundColor: '#000000' }} />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-none" style={{ backgroundColor: '#000000', paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', WebkitOverflowScrolling: 'touch' }}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
