import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Check, Trash2, Trophy, Zap, Star, Calendar,
  MessageSquare, Users, Megaphone, UserPlus, UserCheck,
  Heart, MessageCircle, Bookmark, Swords, Award, Flame,
  ChevronRight,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

// System notifications - platform updates, announcements
const SYSTEM_TYPES = ['system', 'announcement', 'maintenance', 'update'];

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string; accent: string }> = {
  // Social / Loop engagement
  post_liked:          { icon: Heart,          color: "text-red-500",      bg: "bg-red-500/15",      accent: "border-l-red-500" },
  post_commented:      { icon: MessageCircle,  color: "text-blue-400",     bg: "bg-blue-400/15",     accent: "border-l-blue-400" },
  post_saved:          { icon: Bookmark,       color: "text-amber-400",    bg: "bg-amber-400/15",    accent: "border-l-amber-400" },
  // Connections
  connection_request:  { icon: UserPlus,       color: "text-sky-400",      bg: "bg-sky-400/15",      accent: "border-l-sky-400" },
  connection_accepted: { icon: UserCheck,      color: "text-emerald-400",  bg: "bg-emerald-400/15",  accent: "border-l-emerald-400" },
  // Battles
  battle_challenge:    { icon: Swords,         color: "text-orange-500",   bg: "bg-orange-500/15",   accent: "border-l-orange-500" },
  battle_judge_request:{ icon: Swords,         color: "text-purple-400",   bg: "bg-purple-400/15",   accent: "border-l-purple-400" },
  battle_result:       { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  // Scoring / Arena
  submission_judged:   { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  review_complete:     { icon: Star,           color: "text-purple-400",   bg: "bg-purple-400/15",   accent: "border-l-purple-400" },
  solo_scored:         { icon: Award,          color: "text-green-400",    bg: "bg-green-400/15",    accent: "border-l-green-400" },
  drop_scored:         { icon: Flame,          color: "text-orange-400",   bg: "bg-orange-400/15",   accent: "border-l-orange-400" },
  // Events / Tournaments
  rank_changed:        { icon: Zap,            color: "text-blue-400",     bg: "bg-blue-400/15",     accent: "border-l-blue-400" },
  event_starting:      { icon: Calendar,       color: "text-green-500",    bg: "bg-green-500/15",    accent: "border-l-green-500" },
  event_ended:         { icon: Calendar,       color: "text-muted-foreground", bg: "bg-muted/15",    accent: "border-l-muted" },
  tournament_started:  { icon: Trophy,         color: "text-green-500",    bg: "bg-green-500/15",    accent: "border-l-green-500" },
  tournament_scored:   { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  tournament_placement:{ icon: Award,          color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  // Crews / Groups
  achievement:         { icon: Star,           color: "text-purple-400",   bg: "bg-purple-400/15",   accent: "border-l-purple-400" },
  house_accepted:      { icon: Star,           color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  house_invited:       { icon: Star,           color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  dm_received:         { icon: MessageSquare,  color: "text-cyan-400",     bg: "bg-cyan-400/15",     accent: "border-l-cyan-400" },
  chat_mention:        { icon: MessageCircle,  color: "text-red-400",      bg: "bg-red-400/15",      accent: "border-l-red-400" },
  chat_reply:          { icon: MessageCircle,  color: "text-blue-400",     bg: "bg-blue-400/15",     accent: "border-l-blue-400" },
  crew_mention:        { icon: Users,          color: "text-orange-400",   bg: "bg-orange-400/15",   accent: "border-l-orange-400" },
  // System
  system:              { icon: Megaphone,      color: "text-white",        bg: "bg-white/10",        accent: "border-l-white" },
  announcement:        { icon: Megaphone,      color: "text-gold",         bg: "bg-gold/15",         accent: "border-l-gold" },
  maintenance:         { icon: Bell,           color: "text-yellow-500",   bg: "bg-yellow-500/15",   accent: "border-l-yellow-500" },
  update:              { icon: Zap,            color: "text-cyan-400",     bg: "bg-cyan-400/15",     accent: "border-l-cyan-400" },
};

// Quick summary stats for dopamine header
function NotifSummaryBanner({ notifications }: { notifications: Notification[] }) {
  const likes = notifications.filter(n => n.type === 'post_liked' && !n.read).length;
  const comments = notifications.filter(n => n.type === 'post_commented' && !n.read).length;
  const followers = notifications.filter(n => (n.type === 'connection_request' || n.type === 'connection_accepted') && !n.read).length;

  if (likes + comments + followers === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 mb-1 rounded-xl bg-gradient-to-r from-red-500/90 via-pink-500/90 to-rose-500/90 p-3 flex items-center justify-center gap-6 shadow-lg shadow-red-500/20"
    >
      {likes > 0 && (
        <div className="flex items-center gap-1.5">
          <Heart size={16} className="text-white fill-white" />
          <span className="text-white font-bold text-sm">{likes}</span>
        </div>
      )}
      {comments > 0 && (
        <div className="flex items-center gap-1.5">
          <MessageCircle size={16} className="text-white fill-white" />
          <span className="text-white font-bold text-sm">{comments}</span>
        </div>
      )}
      {followers > 0 && (
        <div className="flex items-center gap-1.5">
          <UserPlus size={16} className="text-white" />
          <span className="text-white font-bold text-sm">{followers}</span>
        </div>
      )}
    </motion.div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

function getNotificationLink(notification: Notification): string | null {
  const data = notification.data as Record<string, any>;
  switch (notification.type) {
    case 'post_liked':
    case 'post_commented':
    case 'post_saved':
      return '/feed';
    case 'connection_request':
    case 'connection_accepted':
      return `/editor/${data?.sender_id || data?.user_id || ''}`;
    case 'battle_challenge':
    case 'battle_result':
      return data?.battle_id ? `/battle/${data.battle_id}` : '/arena';
    case 'submission_judged':
    case 'review_complete':
    case 'solo_scored':
    case 'drop_scored':
      return '/arena?tab=my';
    case 'tournament_started':
    case 'tournament_scored':
    case 'tournament_placement':
      return data?.tournament_id ? `/sanctioned/${data.tournament_id}` : '/arena';
    case 'dm_received':
      return '/messages';
    case 'chat_mention':
    case 'chat_reply': {
      const chatType = data?.chat_type;
      if (chatType === 'featured_drop_messages' && data?.drop_id) return `/drop/${data.drop_id}`;
      if (chatType === 'battle_messages' && data?.battle_id) return `/battle/${data.battle_id}`;
      if (chatType === 'arena_messages' && data?.arena_id) return `/arena/${data.arena_id}`;
      if (chatType === 'competition_messages' && data?.competition_id) return `/arena/competition/${data.competition_id}`;
      return '/arena';
    }
    case 'quick_fight_result':
      return data?.fight_id ? `/quick-fight/${data.fight_id}` : '/arena';
    case 'practice_matched':
      return data?.match_id ? `/practice/${data.match_id}` : '/arena';
    case 'battle_invite':
      return data?.battle_id ? `/battle/${data.battle_id}` : '/arena';
    default:
      return null;
  }
}

function NotificationItem({ notification, onMarkAsRead, onDelete, index }: NotificationItemProps) {
  const config = typeConfig[notification.type] || { icon: Bell, color: "text-foreground", bg: "bg-muted", accent: "border-l-muted" };
  const Icon = config.icon;
  const link = getNotificationLink(notification);
  const data = notification.data as Record<string, any>;
  const avatarUrl = data?.liker_avatar || data?.commenter_avatar || data?.sender_avatar || data?.avatar || null;

  const content = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative flex items-start gap-3 p-3 mx-2 my-1 rounded-lg border-l-[3px] transition-all
        ${config.accent}
        ${notification.read 
          ? 'opacity-50 bg-transparent hover:opacity-80' 
          : 'bg-white/[0.03] hover:bg-white/[0.06]'
        }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      {/* Avatar or Icon */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <div className="relative">
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${config.bg} border border-background`}>
              <Icon size={10} className={config.color} />
            </div>
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}>
            <Icon size={18} className={config.color} />
          </div>
        )}
        {/* Unread dot */}
        {!notification.read && (
          <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-background animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium leading-tight">{notification.title}</p>
        {notification.message && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{notification.message}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}
            className="p-1 text-muted-foreground hover:text-gold transition-colors"
            title="Mark as read"
          >
            <Check size={12} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Arrow indicator for links */}
      {link && (
        <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 self-center" />
      )}
    </motion.div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }
  return content;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'activity' | 'system'>('activity');
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const activityNotifications = notifications.filter(n => !SYSTEM_TYPES.includes(n.type));
  const systemNotifications = notifications.filter(n => SYSTEM_TYPES.includes(n.type));
  const activityUnread = activityNotifications.filter(n => !n.read).length;
  const systemUnread = systemNotifications.filter(n => !n.read).length;

  const renderNotificationList = (items: Notification[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1">When people interact with your content, you'll see it here</p>
        </div>
      );
    }

    return (
      <div className="py-1">
        {items.map((notification, i) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            index={i}
          />
        ))}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 transition-transform active:scale-90">
          <Bell size={20} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border p-0">
        <SheetHeader className="px-4 pt-4 pb-3 pr-14 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg tracking-wide">NOTIFICATIONS</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-primary uppercase tracking-widest font-bold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'activity' | 'system')} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-transparent rounded-none border-b border-border h-11">
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none relative font-display tracking-wide text-sm"
            >
              <span>Activity</span>
              {activityUnread > 0 && (
                <span className="ml-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activityUnread > 99 ? '99+' : activityUnread}
                </span>
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold data-[state=inactive]:opacity-0 transition-opacity" 
                    style={{ opacity: tab === 'activity' ? 1 : 0 }} />
            </TabsTrigger>
            <TabsTrigger 
              value="system"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none relative font-display tracking-wide text-sm"
            >
              <span>System</span>
              {systemUnread > 0 && (
                <span className="ml-1.5 min-w-[20px] h-5 px-1 bg-white/80 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {systemUnread > 99 ? '99+' : systemUnread}
                </span>
              )}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold transition-opacity" 
                    style={{ opacity: tab === 'system' ? 1 : 0 }} />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-0 overflow-y-auto max-h-[calc(100vh-180px)]">
            <NotifSummaryBanner notifications={activityNotifications} />
            {renderNotificationList(activityNotifications)}
          </TabsContent>
          
          <TabsContent value="system" className="mt-0 overflow-y-auto max-h-[calc(100vh-180px)]">
            {systemNotifications.length === 0 && !loading ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No system updates</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Platform announcements will appear here</p>
              </div>
            ) : (
              renderNotificationList(systemNotifications)
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
