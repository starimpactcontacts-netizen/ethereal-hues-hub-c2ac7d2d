import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, User, LogIn, Infinity as InfinityIcon } from "lucide-react";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useActiveBattles } from "@/hooks/useActiveBattles";
import GlitchEdge from "@/components/loopgate/GlitchEdge";
import { motion } from "framer-motion";

// Custom 3-segment loop arrow icon
function LoopIcon({ size = 20, strokeWidth = 1.5, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* 3 arc segments with arrow tips forming a continuous loop */}
      <path
        d="M12 3 C15.5 3 18.5 5.5 19.5 9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M19.5 9 L17.5 8 M19.5 9 L19 11"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 9 C20.5 12.5 19 16.5 15.5 19"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M15.5 19 L16.5 17 M15.5 19 L13.5 18.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 19 C12 21 7.5 20 5 17 C3.5 14.5 3.5 11 4.5 8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M4.5 8.5 L6.5 9.5 M4.5 8.5 L5 6.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { to: "/hub", icon: Home, label: "Hub" },
  { to: "/feed", label: "Loop", isLoop: true },
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
                  {'isLoop' in item && item.isLoop ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <LoopIcon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    </motion.div>
                  ) : item.icon ? (
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  ) : null}
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
