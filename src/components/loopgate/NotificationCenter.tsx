import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Check, Trash2, Trophy, Zap, Star, Calendar,
  MessageSquare, Users, Megaphone, UserPlus, UserCheck,
  Heart, MessageCircle, Bookmark, Swords, Award, Flame,
  ChevronRight, Mail, Loader2, X,
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ── Inline email settings panel ──────────────────────────────────────────────
function EmailAlertsPanel() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [battles, setBattles] = useState(true);
  const [comps, setComps] = useState(true);
  const [events, setEvents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('notification_email, notify_battles, notify_scores, notify_drops, email')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setLoaded(true); return; }
        const d = data as any;
        setEmail(d.notification_email || d.email || user.email || '');
        setBattles(d.notify_battles ?? true);
        setComps(d.notify_scores ?? true);
        setEvents(d.notify_drops ?? true);
        setLoaded(true);
      });
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    const emailVal = email.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      toast.error('Enter a valid email'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      notification_email: emailVal || null,
      notify_battles: battles,
      notify_scores: comps,
      notify_drops: events,
    } as any).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Could not save');
    else toast.success('Email alerts saved');
  };

  if (!loaded) return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-white/30" />
    </div>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-gold' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-1'}`} />
    </button>
  );

  const rows = [
    { label: 'Edit Battles', desc: 'When someone accepts your challenge', on: battles, toggle: () => setBattles(v => !v), icon: Swords },
    { label: 'Competitions', desc: 'When a competition you joined goes live', on: comps, toggle: () => setComps(v => !v), icon: Trophy },
    { label: 'Events', desc: 'When a live event or tournament starts', on: events, toggle: () => setEvents(v => !v), icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-white/35 leading-relaxed">
        Get emailed when someone accepts your battle or a competition goes live. Only what you turn on.
      </p>

      {/* Email input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-1.5">
          <Mail size={10} /> Notification Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full h-10 px-3 text-[13px] text-white placeholder:text-white/20 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:border-gold/40 transition-colors"
        />
      </div>

      {/* Toggles */}
      <div className="divide-y divide-white/[0.05] border border-white/[0.06]">
        {rows.map(({ label, desc, on, toggle, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-3 py-3">
            <Icon size={14} className="text-white/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-white/80">{label}</p>
              <p className="text-[10px] text-white/30">{desc}</p>
            </div>
            <Toggle on={on} onToggle={toggle} />
          </div>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full h-10 bg-gold text-black font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

const SYSTEM_TYPES = ['system', 'announcement', 'maintenance', 'update'];

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  post_liked:           { icon: Heart,          color: "text-red-400",      bg: "bg-red-500/15" },
  post_commented:       { icon: MessageCircle,  color: "text-blue-400",     bg: "bg-blue-400/15" },
  post_saved:           { icon: Bookmark,       color: "text-amber-400",    bg: "bg-amber-400/15" },
  connection_request:   { icon: UserPlus,       color: "text-sky-400",      bg: "bg-sky-400/15" },
  connection_accepted:  { icon: UserCheck,      color: "text-emerald-400",  bg: "bg-emerald-400/15" },
  battle_challenge:     { icon: Swords,         color: "text-orange-400",   bg: "bg-orange-500/15" },
  battle_accepted:      { icon: Swords,         color: "text-red-400",      bg: "bg-red-500/15" },
  battle_judge_request: { icon: Swords,         color: "text-purple-400",   bg: "bg-purple-400/15" },
  battle_result:        { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15" },
  submission_judged:    { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15" },
  review_complete:      { icon: Star,           color: "text-purple-400",   bg: "bg-purple-400/15" },
  solo_scored:          { icon: Award,          color: "text-green-400",    bg: "bg-green-400/15" },
  drop_scored:          { icon: Flame,          color: "text-orange-400",   bg: "bg-orange-400/15" },
  rank_changed:         { icon: Zap,            color: "text-blue-400",     bg: "bg-blue-400/15" },
  event_starting:       { icon: Calendar,       color: "text-green-400",    bg: "bg-green-500/15" },
  event_ended:          { icon: Calendar,       color: "text-white/40",     bg: "bg-white/[0.06]" },
  tournament_started:   { icon: Trophy,         color: "text-green-400",    bg: "bg-green-500/15" },
  tournament_scored:    { icon: Trophy,         color: "text-gold",         bg: "bg-gold/15" },
  tournament_placement: { icon: Award,          color: "text-gold",         bg: "bg-gold/15" },
  achievement:          { icon: Star,           color: "text-purple-400",   bg: "bg-purple-400/15" },
  house_accepted:       { icon: Star,           color: "text-gold",         bg: "bg-gold/15" },
  house_invited:        { icon: Star,           color: "text-gold",         bg: "bg-gold/15" },
  dm_received:          { icon: MessageSquare,  color: "text-cyan-400",     bg: "bg-cyan-400/15" },
  chat_mention:         { icon: MessageCircle,  color: "text-red-400",      bg: "bg-red-400/15" },
  chat_reply:           { icon: MessageCircle,  color: "text-blue-400",     bg: "bg-blue-400/15" },
  crew_mention:         { icon: Users,          color: "text-orange-400",   bg: "bg-orange-400/15" },
  system:               { icon: Megaphone,      color: "text-white",        bg: "bg-white/10" },
  announcement:         { icon: Megaphone,      color: "text-gold",         bg: "bg-gold/15" },
  maintenance:          { icon: Bell,           color: "text-yellow-400",   bg: "bg-yellow-500/15" },
  update:               { icon: Zap,            color: "text-cyan-400",     bg: "bg-cyan-400/15" },
};

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
    case 'battle_accepted':
    case 'battle_result':
      return data?.battle_id ? `/fight/${data.battle_id}` : '/arena';
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
      if (chatType === 'competition_messages' && data?.competition_id) return `/competition/${data.competition_id}`;
      return '/arena';
    }
    case 'event_starting':
      return data?.competition_id ? `/competition/${data.competition_id}` : '/arena';
    case 'announcement':
    case 'system':
      if (data?.mission_id) return `/mission/${data.mission_id}`;
      return null;
    default:
      return null;
  }
}

function timeAgo(ts: string) {
  return formatDistanceToNow(new Date(ts), { addSuffix: true })
    .replace('about ', '')
    .replace('less than a minute ago', 'just now');
}

function NotificationItem({ notification, onMarkAsRead, onDelete, index }: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const cfg = typeConfig[notification.type] || { icon: Bell, color: "text-foreground/60", bg: "bg-white/[0.06]" };
  const Icon = cfg.icon;
  const link = getNotificationLink(notification);
  const data = notification.data as Record<string, any>;
  const avatarUrl = data?.liker_avatar || data?.commenter_avatar || data?.sender_avatar || data?.avatar || null;
  const isSystem = SYSTEM_TYPES.includes(notification.type);
  const [expanded, setExpanded] = useState(false);
  const highlights: string[] = Array.isArray(data?.highlights) ? data.highlights : [];
  const version: string | null = data?.version || null;

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.025 }}
        className={`mx-3 my-1.5 border overflow-hidden cursor-pointer transition-all ${
          notification.read
            ? 'bg-white/[0.02] border-white/[0.05] opacity-60'
            : 'bg-gold/[0.05] border-gold/25 shadow-[0_4px_16px_-8px_rgba(201,168,76,0.25)]'
        }`}
        onClick={() => { if (!notification.read) onMarkAsRead(notification.id); setExpanded(v => !v); }}
      >
        <div className="flex items-start gap-3 p-3.5">
          <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${cfg.bg}`}>
            <Icon size={16} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-gold/70">
                {notification.type === 'announcement' ? 'Announcement' : notification.type === 'update' ? 'Update' : notification.type === 'maintenance' ? 'Maintenance' : 'System'}
              </span>
              {version && <span className="text-[9px] font-bold text-gold bg-gold/10 px-1.5 py-[1px]">v{version}</span>}
              {!notification.read && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <p className="text-[13px] font-black text-white leading-tight" style={{ fontFamily: 'Teko, sans-serif', letterSpacing: '0.02em' }}>
              {notification.title}
            </p>
            {notification.message && (
              <p className={`text-[11.5px] text-white/60 leading-relaxed mt-1 ${expanded ? '' : 'line-clamp-2'}`}>
                {notification.message}
              </p>
            )}
            {expanded && highlights.length > 0 && (
              <ul className="mt-2 space-y-1">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gold shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9.5px] text-white/30">{timeAgo(notification.created_at)}</span>
              {(notification.message && notification.message.length > 80 || highlights.length > 0) && (
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-gold/60 flex items-center gap-0.5">
                  {expanded ? 'Less' : 'More'}
                  <ChevronRight size={10} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </span>
              )}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
            className="p-1 text-white/20 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </motion.div>
    );
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`group relative flex items-start gap-3 px-4 py-3 transition-colors ${
        notification.read ? 'opacity-45' : 'bg-white/[0.025] hover:bg-white/[0.04]'
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      {/* Unread left bar */}
      {!notification.read && (
        <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-gold/60" />
      )}

      {/* Avatar / Icon */}
      <div className="relative shrink-0">
        {avatarUrl ? (
          <>
            <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/[0.08]" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg} border-2 border-[#0d0d0d]`}>
              <Icon size={9} className={cfg.color} />
            </div>
          </>
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
            <Icon size={16} className={cfg.color} />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-foreground leading-snug">{notification.title}</p>
        {notification.message && (
          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-snug">{notification.message}</p>
        )}
        <p className="text-[10px] text-white/25 mt-1">{timeAgo(notification.created_at)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notification.read && (
          <button
            onClick={e => { e.stopPropagation(); onMarkAsRead(notification.id); }}
            className="p-1 text-white/30 hover:text-gold transition-colors"
            title="Mark read"
          >
            <Check size={11} />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
          className="p-1 text-white/30 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {link && <ChevronRight size={13} className="text-white/15 shrink-0 self-center" />}
    </motion.div>
  );

  if (link) return <Link to={link} className="block">{content}</Link>;
  return content;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'activity' | 'system' | 'email'>('activity');
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const activityNotifs = notifications.filter(n => !SYSTEM_TYPES.includes(n.type));
  const systemNotifs = notifications.filter(n => SYSTEM_TYPES.includes(n.type));
  const activityUnread = activityNotifs.filter(n => !n.read).length;
  const systemUnread = systemNotifs.filter(n => !n.read).length;

  const renderList = (items: Notification[], emptyIcon: typeof Bell, emptyMsg: string, emptySubMsg: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
        </div>
      );
    }
    if (items.length === 0) {
      const EmptyIcon = emptyIcon;
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <EmptyIcon className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-[13px] font-bold text-white/40">{emptyMsg}</p>
          <p className="text-[11px] text-white/20 mt-1">{emptySubMsg}</p>
        </div>
      );
    }
    return (
      <div className="py-1 divide-y divide-white/[0.04]">
        {items.map((n, i) => (
          <NotificationItem key={n.id} notification={n} onMarkAsRead={markAsRead} onDelete={deleteNotification} index={i} />
        ))}
      </div>
    );
  };

  const tabs = [
    { key: 'activity' as const, label: 'Activity', badge: activityUnread },
    { key: 'system' as const, label: 'System', badge: systemUnread },
    { key: 'email' as const, label: 'Email Alerts', badge: 0 },
  ];

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
                className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 border-0 flex flex-col overflow-hidden"
        style={{ background: '#0d0d0d' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }} />
        {/* Gold top accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.2) 70%, transparent)' }} />

        {/* Close button */}
        <SheetClose className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 hover:text-white transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3 pr-14 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[18px] font-black tracking-[0.1em] text-white" style={{ fontFamily: 'Teko, sans-serif' }}>
              NOTIFICATIONS
            </h2>
            {unreadCount > 0 && (
              <p className="text-[10px] text-white/30 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && tab !== 'email' && (
            <button
              onClick={markAllAsRead}
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 hover:text-gold transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="relative z-10 flex border-b border-white/[0.06]">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-10 text-[11px] font-black uppercase tracking-[0.1em] transition-colors relative ${
                tab === t.key ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {t.key === 'email' && <Mail size={11} />}
              {t.label}
              {t.badge > 0 && (
                <span className="min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-sm flex items-center justify-center">
                  {t.badge > 99 ? '99+' : t.badge}
                </span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          {tab === 'activity' && renderList(
            activityNotifs, Bell,
            'No activity yet',
            'Likes, battles, and more will appear here'
          )}
          {tab === 'system' && renderList(
            systemNotifs, Megaphone,
            'No system updates',
            'Platform announcements will appear here'
          )}
          {tab === 'email' && (
            <div className="p-4">
              <EmailAlertsPanel />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
