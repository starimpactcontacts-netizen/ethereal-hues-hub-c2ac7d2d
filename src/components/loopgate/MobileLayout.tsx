import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function MobileLayout() {
  const location = useLocation();
  const hideNavPaths = ["/admin", "/studio", "/editorium"];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
      <main className="flex-1 pb-14">
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
