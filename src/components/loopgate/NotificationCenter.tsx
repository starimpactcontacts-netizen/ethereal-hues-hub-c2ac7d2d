import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, X, Trophy, Zap, Star, Calendar } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  submission_judged: { icon: Trophy, color: "text-gold", bg: "bg-gold/10" },
  rank_changed: { icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" },
  event_starting: { icon: Calendar, color: "text-green-500", bg: "bg-green-500/10" },
  event_ended: { icon: Calendar, color: "text-muted-foreground", bg: "bg-muted/10" },
  achievement: { icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
  house_accepted: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
  house_invited: { icon: Star, color: "text-gold", bg: "bg-gold/10" },
  review_complete: { icon: Star, color: "text-purple-400", bg: "bg-purple-400/10" },
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
  const reviewId = (notification.data as { review_id?: string })?.review_id;
  const isReview = notification.type === 'review_complete';

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
          
          {eventId && !isReview && (
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
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
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

        <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified when your submissions are judged
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
