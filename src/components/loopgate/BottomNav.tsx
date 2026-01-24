import { NavLink, useNavigate } from "react-router-dom";
import { Home, IterationCcw, Search, User, LogIn, Infinity as InfinityIcon } from "lucide-react";
import { useGuestMode } from "@/hooks/useGuestMode";

const navItems = [
  { to: "/hub", icon: Home, label: "Hub" },
  { to: "/feed", icon: IterationCcw, label: "Loop" },
  { to: "/index", icon: Search, label: "Discover" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { isGuest, clearGuest } = useGuestMode();
  const navigate = useNavigate();

  const handleSignIn = () => {
    clearGuest();
    navigate("/start");
  };

  const handleArenaClick = () => {
    navigate("/arena");
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
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
          {/* Left side items (Hub, Rankings) */}
          {navItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em]">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Center Arena Button - THE ACTION BUTTON */}
          <button
            onClick={handleArenaClick}
            className="relative flex flex-col items-center justify-center -mt-5"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 -top-3 w-16 h-16 bg-gold/30 rounded-full blur-xl" />
            
            {/* Button circle */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-gold via-amber-400 to-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/40 border-2 border-gold/60">
              <InfinityIcon className="w-7 h-7 text-background" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-gold mt-1">
              Arena
            </span>
          </button>

          {/* Right side items (Discover, Profile) */}
          {navItems.slice(2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em]">
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
