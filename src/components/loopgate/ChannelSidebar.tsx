import { useState } from "react";
import { Hash, Volume2, Megaphone, BookOpen, Lock, ChevronDown, ChevronRight, Plus, Settings, Users, ArrowLeft } from "lucide-react";
import { CrewChannel } from "@/hooks/useCrewChannels";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChannelSidebarProps {
  channels: CrewChannel[];
  channelsByCategory: Record<string, CrewChannel[]>;
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  unreadCounts: Record<string, number>;
  onlineCount: number;
  crewName: string;
  isOfficer?: boolean;
  onManageChannels?: () => void;
  onBack?: () => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  text: <Hash className="w-4 h-4" />,
  announcement: <Megaphone className="w-4 h-4" />,
  rules: <BookOpen className="w-4 h-4" />,
  voice: <Volume2 className="w-4 h-4" />,
};

export default function ChannelSidebar({
  channels,
  channelsByCategory,
  activeChannelId,
  onSelectChannel,
  unreadCounts,
  onlineCount,
  crewName,
  isOfficer = false,
  onManageChannels,
  onBack,
}: ChannelSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const sortedCategories = Object.keys(channelsByCategory).sort((a, b) => {
    const aOrder = channelsByCategory[a][0]?.category_order ?? 99;
    const bOrder = channelsByCategory[b][0]?.category_order ?? 99;
    return aOrder - bOrder;
  });

  return (
    <div className="w-60 bg-surface-1 border-r border-border flex flex-col h-full">
      {/* Crew Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <h2 className="font-semibold text-sm truncate flex-1">{crewName}</h2>
          {isOfficer && onManageChannels && (
            <button
              onClick={onManageChannels}
              className="p-1.5 rounded hover:bg-muted/50 transition-colors shrink-0"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{onlineCount} online</span>
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto py-2">
        {sortedCategories.map((category) => {
          const categoryChannels = channelsByCategory[category];
          const isCollapsed = collapsedCategories.has(category);
          const totalUnread = categoryChannels.reduce(
            (sum, ch) => sum + (unreadCounts[ch.id] || 0),
            0
          );

          return (
            <div key={category} className="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-1 px-2 py-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 hover:text-muted-foreground transition-colors group"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                <span className="flex-1 text-left">{category}</span>
                {isCollapsed && totalUnread > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {totalUnread}
                  </span>
                )}
              </button>

              {/* Channels */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    {categoryChannels
                      .sort((a, b) => a.channel_order - b.channel_order)
                      .map((channel) => {
                        const isActive = channel.id === activeChannelId;
                        const unread = unreadCounts[channel.id] || 0;
                        const icon = CHANNEL_ICONS[channel.channel_type] || CHANNEL_ICONS.text;

                        return (
                          <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 mx-1 rounded transition-colors group",
                              isActive
                                ? "bg-muted/60 text-foreground"
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "transition-colors",
                                isActive ? "text-foreground" : "text-muted-foreground/70"
                              )}
                            >
                              {icon}
                            </span>
                            <span
                              className={cn(
                                "flex-1 text-left text-sm truncate",
                                unread > 0 && !isActive && "font-semibold text-foreground"
                              )}
                            >
                              {channel.name}
                            </span>
                            {channel.is_locked && (
                              <Lock className="w-3 h-3 text-muted-foreground/50" />
                            )}
                            {unread > 0 && !isActive && (
                              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border/50">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors text-sm">
          <Users className="w-4 h-4" />
          <span>Members</span>
        </button>
      </div>
    </div>
  );
}
