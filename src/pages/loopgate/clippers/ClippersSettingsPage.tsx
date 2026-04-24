import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Bell, AtSign, Mail, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import AvatarUploadModal from '@/components/loopgate/AvatarUploadModal';

interface ProfileRow {
  username: string;
  avatar_url: string | null;
  email: string | null;
  notification_email: string | null;
  notify_battles: boolean;
  notify_drops: boolean;
  notify_connections: boolean;
  notify_scores: boolean;
}

export default function ClippersSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [notifEmail, setNotifEmail] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/missions');
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, email, notification_email, notify_battles, notify_drops, notify_connections, notify_scores')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(data as ProfileRow);
        setUsername(data.username || '');
        setNotifEmail(data.notification_email || data.email || user.email || '');
      } else {
        setNotifEmail(user.email || '');
      }
      setLoading(false);
    };
    load();
  }, [user, navigate]);

  const saveUsername = async () => {
    if (!user) return;
    const clean = username.trim().replace(/^@/, '');
    if (clean.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      toast.error('Letters, numbers, and underscores only');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: clean })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Username already taken' : 'Could not update username');
      return;
    }
    setProfile((p) => (p ? { ...p, username: clean } : p));
    toast.success('Username updated');
  };

  const saveNotifEmail = async () => {
    if (!user) return;
    const v = notifEmail.trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error('Enter a valid email');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ notification_email: v || null })
      .eq('id', user.id);
    if (error) {
      toast.error('Could not save email');
      return;
    }
    toast.success('Notification email saved');
  };

  const toggleNotif = async (key: 'notify_battles' | 'notify_drops' | 'notify_connections' | 'notify_scores') => {
    if (!user || !profile) return;
    const next = !profile[key];
    setProfile({ ...profile, [key]: next });
    const { error } = await supabase.from('profiles').update({ [key]: next }).eq('id', user.id);
    if (error) {
      setProfile({ ...profile, [key]: !next });
      toast.error('Could not update preference');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-white/60" />
      </div>
    );
  }

  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-apple-tight text-[28px] font-bold text-white leading-tight">Settings</h1>

      {/* Avatar */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E93] mb-2 font-semibold">Profile picture</p>
        <button
          onClick={() => setAvatarOpen(true)}
          className="flex items-center gap-3 w-full p-3 rounded-[14px] active:opacity-60 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#3a3a3c,#1c1c1e)' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[20px] font-semibold text-white/85">{initial}</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] text-white font-medium">Change photo</p>
            <p className="text-[12px] text-[#8E8E93]">Tap to upload or replace</p>
          </div>
          <Camera className="w-4 h-4 text-white/60" />
        </button>
      </section>

      {/* Username */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E93] mb-2 font-semibold">Username</p>
        <div
          className="rounded-[14px] p-3 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <AtSign className="w-4 h-4 text-[#8E8E93] shrink-0" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#5a5a5e]"
          />
          <button
            onClick={saveUsername}
            disabled={saving || username.trim().replace(/^@/, '') === profile?.username}
            className="px-3 h-8 rounded-full text-[13px] font-semibold text-black bg-[#D4A857] disabled:opacity-40 disabled:bg-white/10 disabled:text-white/50 active:opacity-70 transition-opacity"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
          </button>
        </div>
        <p className="text-[11px] text-[#8E8E93] mt-1.5 px-1">This is your @tag shown on missions.</p>
      </section>

      {/* Email (account) */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E93] mb-2 font-semibold">Account email</p>
        <div
          className="rounded-[14px] p-3 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}
        >
          <Mail className="w-4 h-4 text-[#8E8E93] shrink-0" />
          <span className="flex-1 text-[15px] text-white/80 truncate">{user?.email || '—'}</span>
          <Check className="w-4 h-4 text-[#34c759]" />
        </div>
        <p className="text-[11px] text-[#8E8E93] mt-1.5 px-1">Used to sign in. Set on day one.</p>
      </section>

      {/* Notifications */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E93] mb-2 font-semibold">Notifications</p>

        <div
          className="rounded-[14px] p-3 flex items-center gap-2 mb-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <Bell className="w-4 h-4 text-[#8E8E93] shrink-0" />
          <input
            value={notifEmail}
            onChange={(e) => setNotifEmail(e.target.value)}
            onBlur={saveNotifEmail}
            placeholder="Notification email"
            type="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#5a5a5e]"
          />
        </div>

        <div
          className="rounded-[14px] divide-y divide-white/[0.08] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <ToggleRow label="Mission updates" desc="Status, payouts, and feedback" on={!!profile?.notify_drops} onChange={() => toggleNotif('notify_drops')} />
          <ToggleRow label="Battles & matches" desc="Challenges and results" on={!!profile?.notify_battles} onChange={() => toggleNotif('notify_battles')} />
          <ToggleRow label="Scores & reviews" desc="Judge feedback on your edits" on={!!profile?.notify_scores} onChange={() => toggleNotif('notify_scores')} />
          <ToggleRow label="Connections" desc="Follows and friend requests" on={!!profile?.notify_connections} onChange={() => toggleNotif('notify_connections')} />
        </div>
      </section>

      {user && (
        <AvatarUploadModal
          isOpen={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          userId={user.id}
          currentAvatarUrl={profile?.avatar_url}
          onUpdated={async () => {
            const { data } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .maybeSingle();
            if (data && profile) setProfile({ ...profile, avatar_url: data.avatar_url });
          }}
        />
      )}
    </div>
  );
}

function ToggleRow({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-white/[0.04] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-white">{label}</p>
        <p className="text-[12px] text-[#8E8E93] mt-0.5">{desc}</p>
      </div>
      <span
        className="relative w-[46px] h-[28px] rounded-full transition-colors shrink-0"
        style={{ background: on ? '#34c759' : 'rgba(120,120,128,0.32)' }}
      >
        <span
          className="absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow transition-all"
          style={{ left: on ? '20px' : '2px' }}
        />
      </span>
    </button>
  );
}