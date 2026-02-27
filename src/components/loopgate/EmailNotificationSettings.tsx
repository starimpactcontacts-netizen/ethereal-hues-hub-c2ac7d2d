import { useState, useEffect } from 'react';
import { Mail, Bell, Swords, Music, Users, Star, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface NotifPrefs {
  notification_email: string | null;
  notify_scores: boolean;
  notify_battles: boolean;
  notify_drops: boolean;
  notify_connections: boolean;
}

export default function EmailNotificationSettings() {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<NotifPrefs>({
    notification_email: null,
    notify_scores: true,
    notify_battles: true,
    notify_drops: true,
    notify_connections: true,
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchPrefs = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('notification_email, notify_scores, notify_battles, notify_drops, notify_connections, email')
        .eq('id', user.id)
        .single();

      if (data) {
        setPrefs({
          notification_email: (data as any).notification_email || null,
          notify_scores: (data as any).notify_scores ?? true,
          notify_battles: (data as any).notify_battles ?? true,
          notify_drops: (data as any).notify_drops ?? true,
          notify_connections: (data as any).notify_connections ?? true,
        });
        setEmail((data as any).notification_email || (data as any).email || user.email || '');
      }
      setLoaded(true);
    };
    fetchPrefs();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const emailVal = email.trim();
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      toast.error('Please enter a valid email');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        notification_email: emailVal || null,
        notify_scores: prefs.notify_scores,
        notify_battles: prefs.notify_battles,
        notify_drops: prefs.notify_drops,
        notify_connections: prefs.notify_connections,
      } as any)
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save preferences');
    } else {
      toast.success('Email notifications updated!');
    }
    setSaving(false);
  };

  const togglePref = (key: keyof NotifPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const toggleItems = [
    { key: 'notify_scores' as const, icon: Star, label: 'Score Ratings', desc: 'When your edit gets rated by a judge', color: 'text-amber-400' },
    { key: 'notify_battles' as const, icon: Swords, label: 'Battle Updates', desc: 'Challenges, results, and battle reminders', color: 'text-red-400' },
    { key: 'notify_drops' as const, icon: Music, label: 'New Drops', desc: 'When a new featured song drops', color: 'text-emerald-400' },
    { key: 'notify_connections' as const, icon: Users, label: 'Connections', desc: 'New connection requests & accepts', color: 'text-blue-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-red-950 flex items-center justify-center shrink-0">
          <Bell className="w-4.5 h-4.5 text-red-400" />
        </div>
        <div>
          <h3 className="text-[14px] font-black text-foreground tracking-tight">Email Notifications</h3>
          <p className="text-[11px] text-muted-foreground">Get notified about scores, battles & drops</p>
        </div>
      </div>

      {/* Email Input */}
      <div className="bg-surface-1 border border-border p-3">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
          <Mail className="w-3 h-3 inline mr-1" />
          Notification Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full h-10 px-3 bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500/50 transition-colors"
        />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          This is separate from your login email. We'll only send notifications you enable.
        </p>
      </div>

      {/* Toggle preferences */}
      <div className="bg-surface-1 border border-border divide-y divide-border">
        {toggleItems.map(item => (
          <button
            key={item.key}
            onClick={() => togglePref(item.key)}
            className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left"
          >
            <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${
              prefs[item.key] ? 'bg-red-600 justify-end' : 'bg-zinc-700 justify-start'
            }`}>
              <div className="w-4 h-4 bg-white rounded-full mx-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-[13px] transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {saving ? 'Saving…' : 'Save Notification Settings'}
      </button>
    </motion.div>
  );
}
