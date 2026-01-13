import { NavLink, useNavigate } from "react-router-dom";
import { Home, Trophy, Search, Users, User, LogIn } from "lucide-react";
import { useGuestMode } from "@/hooks/useGuestMode";

const navItems = [
  { to: "/hub", icon: Home, label: "Hub" },
  { to: "/rankings", icon: Trophy, label: "Rankings" },
  { to: "/index", icon: Search, label: "Index" },
  { to: "/crews", icon: Users, label: "Crews" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { isGuest, clearGuest } = useGuestMode();
  const navigate = useNavigate();

  const handleSignIn = () => {
    clearGuest();
    navigate("/auth");
  };

  return (
    <>
      {/* Guest Mode Banner */}
      {isGuest && (
        <div className="fixed bottom-14 left-0 right-0 z-50 bg-gold/10 border-t border-gold/30 px-4 py-2 flex items-center justify-between safe-bottom">
          <span className="text-xs text-gold font-medium">
            Browsing as guest (read-only)
          </span>
          <button
            onClick={handleSignIn}
            className="flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/80 transition-colors"
          >
            <LogIn size={14} />
            Sign In
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em]">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
