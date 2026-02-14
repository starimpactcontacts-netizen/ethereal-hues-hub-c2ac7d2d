import { NavLink, useNavigate } from "react-router-dom";
import { Home, IterationCcw, Search, User, LogIn, Infinity as InfinityIcon } from "lucide-react";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useActiveBattles } from "@/hooks/useActiveBattles";
import GlitchEdge from "@/components/loopgate/GlitchEdge";
import { motion } from "framer-motion";

const navItems = [
  { to: "/hub", icon: Home, label: "Hub" },
  { to: "/feed", icon: IterationCcw, label: "Loop" },
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
                  {item.label === 'Loop' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    </motion.div>
                  ) : (
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  )}
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
            className="flex flex-col items-center justify-center group relative"
          >
            {/* Active battle indicator */}
            {hasActiveBattle && (
              <span className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse z-10 border border-background" />
            )}
            {/* Offset glitch layers - infinite color morphing */}
            <div className="relative">
              <GlitchEdge side="left" className="absolute w-11 h-9 rounded-[6px]" style={{ left: '-4px' }} />
              <GlitchEdge side="right" className="absolute w-11 h-9 rounded-[6px]" style={{ left: '4px' }} />
              <div className="relative w-11 h-9 bg-white rounded-[6px] flex items-center justify-center group-active:scale-95 transition-transform">
                <InfinityIcon className="w-5 h-5 text-black" strokeWidth={2.5} />
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
