import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, User, LogIn, Infinity as InfinityIcon, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="absolute inset-0 bg-background" style={{ bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))' }} />
        {/* Top border with synced arena color glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.04]" />
        {/* Core bright line — hue-synced, subtle */}
        <motion.div
          className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-[160px] h-[1px] opacity-25"
          style={{ background: "linear-gradient(90deg, transparent, #f59e0b, #a855f7, transparent)" }}
          animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* Soft ambient glow */}
        <motion.div
          className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[100px] h-[6px] blur-sm opacity-10"
          style={{ background: "radial-gradient(ellipse, #a855f7, transparent)" }}
          animate={{ filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative grid grid-cols-5 h-16 max-w-lg mx-auto">
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

          {/* Center Arena Button — Diamond shape with glitch aura */}
          <button
            onClick={handleArenaClick}
            className="flex flex-col items-center justify-center group relative -mt-3"
          >
            {/* Active battle indicator */}
            {hasActiveBattle && (
              <span className="absolute -top-2 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse z-20 border border-background" />
            )}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-3 rotate-45 bg-white/[0.04] blur-lg" />
              <GlitchEdge side="left" className="absolute w-[46px] h-[46px] rotate-45" style={{ left: '-3px', top: '0px' }} />
              <GlitchEdge side="right" className="absolute w-[46px] h-[46px] rotate-45" style={{ left: '3px', top: '0px' }} />
              <div className="relative w-[46px] h-[46px] bg-white rotate-45 flex items-center justify-center group-active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.18)]">
                {/* Subtle gate pattern */}
                <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
                  <svg className="w-full h-full" viewBox="0 0 46 46">
                    <pattern id="nav-gate-d" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                      <polygon points="5,1 9,4 9,8 5,10 1,8 1,4" fill="none" stroke="black" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#nav-gate-d)" />
                  </svg>
                </div>
                <InfinityIcon className="w-5 h-5 text-black relative z-10 -rotate-45" strokeWidth={2.5} />
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
