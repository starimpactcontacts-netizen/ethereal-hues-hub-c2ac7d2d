import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, ExternalLink, Trash2, Loader2, Youtube, Instagram, Music2, Twitter, Facebook, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LinkedAcc {
  id: string;
  platform: string;
  handle: string;
  profile_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: '#FFFFFF' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF453A' },
  { id: 'x', label: 'X', icon: Twitter, color: '#FFFFFF' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#0A84FF' },
];

export default function ClippersAccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<LinkedAcc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [platform, setPlatform] = useState('tiktok');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('clipper_linked_accounts')
      .select('id, platform, handle, profile_url, is_verified, verified_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAccounts((data || []) as LinkedAcc[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const addAccount = async () => {
    if (!user) { setShowGate(true); return; }
    if (!handle.trim()) { toast.error('Enter a handle'); return; }
    setAdding(true);
    const cleanHandle = handle.replace(/^@/, '').trim();
    const { error } = await supabase.from('clipper_linked_accounts').insert({
      user_id: user.id, platform, handle: cleanHandle, profile_url: profileUrl || null,
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account linked');
    setHandle(''); setProfileUrl(''); setShowAdd(false); load();
  };

  const unlink = async (id: string) => {
    await supabase.from('clipper_linked_accounts').delete().eq('id', id);
    setAccounts((a) => a.filter((x) => x.id !== id));
    toast.success('Unlinked');
  };

  const verifiedCount = accounts.filter((a) => a.is_verified).length;

  return (
    <ClippersLayout title="Linked">
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4 flex items-end justify-between">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Linked</h1>
        <button
          onClick={() => (user ? setShowAdd(true) : setShowGate(true))}
          className="flex items-center gap-1 h-8 px-3 rounded-full bg-[#0A84FF] text-white text-[14px] font-semibold active:opacity-60"
        >
          <Plus className="w-[15px] h-[15px]" strokeWidth={2.8} /> Link
        </button>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Linked" value={accounts.length.toString()} />
          <StatCard label="Verified" value={verifiedCount.toString()} accent="#0A84FF" />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-[16px] bg-[#1c1c1e] animate-pulse" />)}
          </div>
        ) : !user || accounts.length === 0 ? (
          <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
            <Link2 className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-white mb-1">No accounts linked</p>
            <p className="text-[13px] text-[#8E8E93]">{user ? 'Add TikTok, IG or YouTube' : 'Lock in to link socials'}</p>
          </div>
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: '#1c1c1e' }}>
            {accounts.map((a, idx) => {
              const meta = PLATFORMS.find((p) => p.id === a.platform);
              const Icon = meta?.icon || Link2;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={idx === accounts.length - 1 ? {} : { borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-10 h-10 flex-shrink-0 rounded-[10px] flex items-center justify-center" style={{ background: '#2c2c2e' }}>
                    <Icon className="w-5 h-5" style={{ color: meta?.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[16px] font-semibold text-white tracking-[-0.02em] truncate leading-tight">@{a.handle}</p>
                      {a.is_verified && <BadgeCheck className="w-4 h-4 text-[#0A84FF] flex-shrink-0" fill="#0A84FF" stroke="#000" strokeWidth={2} />}
                    </div>
                    <p className="text-[13px] text-[#8E8E93] mt-0.5">{meta?.label || a.platform}</p>
                  </div>
                  {a.profile_url && (
                    <a href={a.profile_url} target="_blank" rel="noopener noreferrer" className="text-[#8E8E93] active:opacity-50 p-1.5">
                      <ExternalLink className="w-[15px] h-[15px]" />
                    </a>
                  )}
                  <button onClick={() => unlink(a.id)} className="text-[#8E8E93] active:text-[#FF453A] p-1.5 transition-colors">
                    <Trash2 className="w-[15px] h-[15px]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <Sheet onClose={() => setShowAdd(false)} title="Link account">
          <div>
            <p className="text-[13px] text-[#8E8E93] font-medium mb-2 px-1">Platform</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-[10px] active:opacity-60 transition-all"
                  style={{
                    background: platform === p.id ? '#0A84FF' : 'rgba(118,118,128,0.24)',
                  }}
                >
                  <p.icon className="w-5 h-5" style={{ color: platform === p.id ? '#fff' : p.color }} />
                  <span className="text-[10px] font-semibold text-white">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Field label="Handle">
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <Field label="Profile URL (optional)">
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://..."
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <button
            onClick={addAccount}
            disabled={adding}
            className="w-full h-12 rounded-[14px] bg-[#0A84FF] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link account'}
          </button>
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to link your social accounts." />
    </ClippersLayout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: '#1c1c1e' }}>
      <p className="text-[11px] text-[#8E8E93] font-medium">{label}</p>
      <p className="font-apple-tight text-[24px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: accent || '#fff' }}>{value}</p>
    </div>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center font-apple"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] p-5 space-y-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        style={{ background: '#1c1c1e' }}
      >
        <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden" />
        <h2 className="text-[22px] font-bold text-white tracking-[-0.022em]">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-[#8E8E93] font-medium px-1">{label}</label>
      {children}
    </div>
  );
}
