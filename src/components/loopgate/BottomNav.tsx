import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, User, LogIn, Infinity as InfinityIcon, RefreshCw } from "lucide-react";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useActiveBattles } from "@/hooks/useActiveBattles";
import GlitchEdge from "@/components/loopgate/GlitchEdge";

const navItems = [
  { to: "/hub", icon: Home, label: "Hub" },
  { to: "/feed", icon: RefreshCw, label: "Loop" },
  { to: "/index", icon: Search, label: "Discover" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { isGuest, clearGuest } = useGuestMode();
  const { hasActiveBattle } = useActiveBattles();
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
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* Left side items (Hub, Loop) */}
          {navItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-white" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-semibold tracking-wide">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Center Arena Button - White x Gold Neon Glitch Aura */}
          <button
            onClick={handleArenaClick}
            className="flex flex-col items-center justify-center group relative -mt-1"
          >
            {/* Active battle indicator */}
            {hasActiveBattle && (
              <span className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse z-10 border border-background" />
            )}
            {/* Offset glitch layers - infinite color morphing */}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-2 rounded-2xl bg-white/[0.06] blur-md" />
              <GlitchEdge side="left" className="absolute w-14 h-11 rounded-xl" style={{ left: '-4px' }} />
              <GlitchEdge side="right" className="absolute w-14 h-11 rounded-xl" style={{ left: '4px' }} />
              <div className="relative w-14 h-11 bg-white rounded-xl flex items-center justify-center group-active:scale-95 transition-transform shadow-[0_0_16px_rgba(255,255,255,0.15)]">
                {/* Subtle gate pattern in white space */}
                <div className="absolute inset-0 rounded-xl overflow-hidden opacity-[0.04]">
                  <svg className="w-full h-full" viewBox="0 0 56 44">
                    <pattern id="nav-gate" x="0" y="0" width="11" height="11" patternUnits="userSpaceOnUse">
                      <polygon points="5.5,1 10,4 10,8 5.5,11 1,8 1,4" fill="none" stroke="black" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#nav-gate)" />
                  </svg>
                </div>
                <InfinityIcon className="w-6 h-6 text-black relative z-10" strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Right side items (Discover, Profile) */}
          {navItems.slice(2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-white" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-semibold tracking-wide">
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
