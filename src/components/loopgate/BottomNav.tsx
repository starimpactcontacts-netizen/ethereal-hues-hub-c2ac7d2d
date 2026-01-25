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
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* Left side items (Hub, Loop) */}
          {navItems.slice(0, 2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
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
            className="flex flex-col items-center justify-center group relative"
          >
            {/* Outer ambient glow - gold */}
            <div className="absolute w-16 h-14 bg-gold/25 rounded-xl blur-2xl animate-pulse" />
            
            {/* Glitch layer 1 - offset gold */}
            <div className="absolute w-12 h-10 bg-gold/40 rounded-lg blur-md translate-x-[2px] translate-y-[1px] animate-[pulse_1.5s_ease-in-out_infinite]" />
            
            {/* Glitch layer 2 - offset white */}
            <div className="absolute w-12 h-10 bg-white/30 rounded-lg blur-md -translate-x-[2px] -translate-y-[1px] animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
            
            {/* Button - crisp white with intense gold border glow */}
            <div className="relative w-12 h-10 bg-gradient-to-b from-white via-white to-zinc-50 rounded-lg flex items-center justify-center 
              shadow-[0_0_25px_rgba(212,175,55,0.6),0_0_12px_rgba(255,255,255,0.5),0_0_6px_rgba(212,175,55,0.9),inset_0_0_0_1.5px_rgba(212,175,55,1)]
              group-hover:shadow-[0_0_35px_rgba(212,175,55,0.8),0_0_15px_rgba(255,255,255,0.6),0_0_8px_rgba(212,175,55,1),inset_0_0_0_2px_rgba(212,175,55,1)]
              group-active:scale-95 transition-all duration-150">
              <InfinityIcon className="w-5 h-5 text-zinc-900" strokeWidth={2.5} />
            </div>
          </button>

          {/* Right side items (Discover, Profile) */}
          {navItems.slice(2).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
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
