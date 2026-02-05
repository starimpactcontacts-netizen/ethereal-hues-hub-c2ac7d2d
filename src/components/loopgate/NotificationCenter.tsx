import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, Trophy, Zap, Star, Calendar, MessageSquare, Users, Megaphone, UserPlus, UserCheck } from "lucide-react";
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

// System notifications - platform updates, announcements
const SYSTEM_TYPES = ['system', 'announcement', 'maintenance', 'update'];

// User notifications - personal activity
const USER_TYPES = [
  'submission_judged', 'rank_changed', 'event_starting', 'event_ended',
  'achievement', 'house_accepted', 'house_invited', 'review_complete',
  'tournament_started', 'tournament_scored', 'dm_received', 'crew_mention',
  'connection_request', 'connection_accepted'
];

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  submission_judged: { icon: Trophy, color: "text-gold", bg: "bg-gold/10" },
  rank_changed: { icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" },
  event_starting: { icon: Calendar, color: "text-green-500", bg: "bg-green-500/10" },
  event_ended: { icon: Calendar, color: "text-muted-foreground", bg: "bg-muted/10" },
  achievement: { icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
  house_accepted: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
  house_invited: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
  review_complete: { icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
  tournament_started: { icon: Trophy, color: "text-green-500", bg: "bg-green-500/10" },
  tournament_scored: { icon: Trophy, color: "text-gold", bg: "bg-gold/10" },
  dm_received: { icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  crew_mention: { icon: Users, color: "text-orange-400", bg: "bg-orange-400/10" },
  connection_request: { icon: UserPlus, color: "text-sky-400", bg: "bg-sky-400/10" },
  connection_accepted: { icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  system: { icon: Megaphone, color: "text-white", bg: "bg-white/10" },
  announcement: { icon: Megaphone, color: "text-gold", bg: "bg-gold/10" },
  maintenance: { icon: Bell, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  update: { icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/10" },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const config = typeConfig[notification.type] || { icon: Bell, color: "text-foreground", bg: "bg-muted" };
  const Icon = config.icon;
  const eventId = (notification.data as { event_id?: string })?.event_id;
  const tournamentId = (notification.data as { tournament_id?: string })?.tournament_id;
  const isReview = notification.type === 'review_complete';
  const isTournament = notification.type === 'tournament_started' || notification.type === 'tournament_scored';

  return (
    <div 
      className={`p-4 border-b border-border last:border-0 ${
        notification.read ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
          <Icon size={14} className={config.color} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
          <p className="text-[10px] text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
          
          {isReview && (
            <Link 
              to="/profile"
              className="inline-block mt-2 text-[10px] text-purple-400 uppercase tracking-wider hover:underline"
            >
              View Review →
            </Link>
          )}
          
          {isTournament && tournamentId && (
            <Link 
              to={`/sanctioned/${tournamentId}`}
              className="inline-block mt-2 text-[10px] text-gold uppercase tracking-wider hover:underline"
            >
              View Tournament →
            </Link>
          )}
          
          {eventId && !isReview && !isTournament && (
            <Link 
              to={`/event/${eventId}`}
              className="inline-block mt-2 text-[10px] text-gold uppercase tracking-wider hover:underline"
            >
              View Event →
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!notification.read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-1.5 text-muted-foreground hover:text-gold transition-colors"
              title="Mark as read"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'activity' | 'system'>('activity');
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Split notifications into categories
  const activityNotifications = notifications.filter(n => !SYSTEM_TYPES.includes(n.type));
  const systemNotifications = notifications.filter(n => SYSTEM_TYPES.includes(n.type));
  
  const activityUnread = activityNotifications.filter(n => !n.read).length;
  const systemUnread = systemNotifications.filter(n => !n.read).length;

  const renderNotificationList = (items: Notification[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    
    if (items.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications</p>
        </div>
      );
    }

    return items.map((notification) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    ));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-gold uppercase tracking-wider hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'activity' | 'system')} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-surface-1 rounded-none border-b border-border h-11">
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none relative"
            >
              <span>Activity</span>
              {activityUnread > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activityUnread > 9 ? '9+' : activityUnread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="system"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold rounded-none relative"
            >
              <span>System</span>
              {systemUnread > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-white/80 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {systemUnread > 9 ? '9+' : systemUnread}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="mt-0 overflow-y-auto max-h-[calc(100vh-180px)]">
            {renderNotificationList(activityNotifications)}
          </TabsContent>
          
          <TabsContent value="system" className="mt-0 overflow-y-auto max-h-[calc(100vh-180px)]">
            {systemNotifications.length === 0 && !loading ? (
              <div className="text-center py-12 px-4">
                <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No system updates</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform announcements will appear here
                </p>
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
