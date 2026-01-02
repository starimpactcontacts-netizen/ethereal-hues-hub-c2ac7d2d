import { NavLink } from "react-router-dom";
import { Home, Trophy, Shield, Crown, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Events" },
  { to: "/rankings", icon: Trophy, label: "Rankings" },
  { to: "/leagues", icon: Shield, label: "Leagues" },
  { to: "/championship", icon: Crown, label: "Finals" },
  { to: "/profile", icon: User, label: "Lofile" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium uppercase tracking-[0.1em]">
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
