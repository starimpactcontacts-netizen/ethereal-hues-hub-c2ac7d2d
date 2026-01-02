import { NavLink } from "react-router-dom";
import { Home, Trophy, User, Shield, Crown } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Events" },
  { to: "/rankings", icon: Trophy, label: "Rankings" },
  { to: "/leagues", icon: Shield, label: "Leagues" },
  { to: "/championship", icon: Crown, label: "Finals" },
  { to: "/profile", icon: User, label: "Lofile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-gold"
                  : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide uppercase">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
