import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Users, Flame } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";
import { motion } from "framer-motion";

interface TrendingEditor {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
}

interface TrendingUnit {
  id: string;
  name: string;
  avatar_url: string | null;
  emblem: string;
}

interface FeedSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  trendingEditors: TrendingEditor[];
  trendingUnits: TrendingUnit[];
}

export default function FeedSidebar({ searchQuery, onSearchChange, trendingEditors, trendingUnits }: FeedSidebarProps) {
  const navigate = useNavigate();

  return (
    <div className="w-[320px] shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-hide py-3 pl-6 pr-2 space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search editors, events..."
          className="w-full bg-muted/20 border border-border/20 rounded-full pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted/30 transition-all"
        />
      </div>

      {/* Trending Units */}
      {trendingUnits.length > 0 && (
        <div className="bg-muted/10 border border-border/10 rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-[13px] font-bold text-foreground">Active Units</h3>
          </div>
          <div className="divide-y divide-border/10">
            {trendingUnits.slice(0, 5).map(unit => (
              <motion.button
                key={unit.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                onClick={() => navigate(`/units/${unit.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              >
                <Avatar className="w-8 h-8 rounded-lg">
                  <AvatarImage src={unit.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted text-foreground text-[10px] font-bold rounded-lg">{unit.emblem}</AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-semibold text-foreground truncate">{unit.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Editors */}
      {trendingEditors.length > 0 && (
        <div className="bg-muted/10 border border-border/10 rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <h3 className="text-[13px] font-bold text-foreground">Who to follow</h3>
          </div>
          <div className="divide-y divide-border/10">
            {trendingEditors.slice(0, 6).map(editor => (
              <motion.button
                key={editor.id}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                onClick={() => navigate(`/editor/${editor.id}`)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={editor.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-muted text-foreground text-[9px] font-bold">{editor.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {editor.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 z-10"><VerifiedBadge size="sm" /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-semibold text-foreground truncate">{editor.username}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">@{editor.username}</span>
                </div>
              </motion.button>
            ))}
          </div>
          <button
            onClick={() => navigate('/index')}
            className="w-full text-left px-4 py-2.5 text-[13px] text-primary hover:bg-muted/10 transition-colors"
          >
            Show more
          </button>
        </div>
      )}

      {/* Footer links */}
      <div className="px-2 pt-2">
        <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
          © {new Date().getFullYear()} Loopgate · Terms · Privacy
        </p>
      </div>
    </div>
  );
}
