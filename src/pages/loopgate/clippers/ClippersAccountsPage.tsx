import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, ExternalLink, Trash2, Loader2, Youtube, Instagram, Music2, Twitter, Facebook, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Button } from '@/components/ui/button';
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
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'text-foreground' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400' },
  { id: 'x', label: 'X', icon: Twitter, color: 'text-foreground' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
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
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('clipper_linked_accounts')
      .select('id, platform, handle, profile_url, is_verified, verified_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setAccounts((data || []) as LinkedAcc[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const addAccount = async () => {
    if (!user) {
      setShowGate(true);
      return;
    }
    if (!handle.trim()) {
      toast.error('Enter a handle');
      return;
    }
    setAdding(true);
    const cleanHandle = handle.replace(/^@/, '').trim();
    const { error } = await supabase.from('clipper_linked_accounts').insert({
      user_id: user.id,
      platform,
      handle: cleanHandle,
      profile_url: profileUrl || null,
    });
    setAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Account linked');
    setHandle('');
    setProfileUrl('');
    setShowAdd(false);
    load();
  };

  const unlink = async (id: string) => {
    await supabase.from('clipper_linked_accounts').delete().eq('id', id);
    setAccounts((a) => a.filter((x) => x.id !== id));
    toast.success('Unlinked');
  };

  const verifiedCount = accounts.filter((a) => a.is_verified).length;

  return (
    <ClippersLayout title="LINKED">
      <section className="max-w-6xl mx-auto px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·03</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
          <button
            onClick={() => (user ? setShowAdd(true) : setShowGate(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gold/40 text-gold font-mono text-[10px] tracking-[0.25em] uppercase hover:bg-gold/10 transition-colors active:opacity-70"
          >
            <Plus className="w-3 h-3" /> Link
          </button>
        </div>
        <h1 className="font-display text-[56px] sm:text-[72px] leading-[0.85] tracking-tight">
          Linked <span className="italic text-gold">Socials</span>
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2 tracking-wider uppercase">
          Verify accounts to track payouts
        </p>
      </section>

      <section className="border-y border-white/[0.06]" style={{ background: 'hsl(0 0% 2%)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 divide-x divide-white/[0.06]">
          <Cell index="01" label="Linked" value={accounts.length} />
          <Cell index="02" label="Verified" value={verifiedCount} accent />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-7 space-y-7">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : !user || accounts.length === 0 ? (
          <div className="border border-white/[0.06] p-12 text-center">
            <Link2 className="w-7 h-7 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-[28px] tracking-tight mb-1">No accounts linked</p>
            <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
              {user ? 'Add TikTok, IG or YouTube to start' : 'Lock in to link socials'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">ALL · ACCOUNTS</span>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {accounts.map((a, idx) => {
                const meta = PLATFORMS.find((p) => p.id === a.platform);
                const Icon = meta?.icon || Link2;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, delay: idx * 0.03 }}
                    className="flex items-center gap-4 py-4"
                  >
                    <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 w-7 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="w-10 h-10 flex-shrink-0 border border-white/[0.06] flex items-center justify-center bg-surface-1">
                      <Icon className={`w-4 h-4 ${meta?.color || 'text-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/80">
                          {meta?.label || a.platform}
                        </span>
                        {a.is_verified ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 font-mono tracking-widest uppercase">
                            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                          </span>
                        ) : (
                          <span className="text-[9px] text-gold font-mono tracking-widest uppercase">PENDING</span>
                        )}
                      </div>
                      <p className="font-display text-[20px] leading-none tracking-tight truncate">@{a.handle}</p>
                    </div>
                    {a.profile_url && (
                      <a
                        href={a.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/60 hover:text-gold transition-colors p-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => unlink(a.id)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] backdrop-blur-md flex items-end sm:items-center justify-center"
          style={{ background: 'hsl(0 0% 0% / 0.85)' }}
          onClick={() => setShowAdd(false)}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 38 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-0 sm:border border-white/[0.08] p-7 space-y-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            style={{ boxShadow: '0 -20px 60px hsl(0 0% 0% / 0.7)' }}
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto sm:hidden" />
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·03 / LINK</span>
              <h2 className="font-display text-[32px] leading-none tracking-tight mt-1">Add Account</h2>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1 p-3 border transition-all active:opacity-70 ${
                    platform === p.id ? 'border-gold bg-gold/10' : 'border-white/[0.06] hover:border-gold/40'
                  }`}
                >
                  <p.icon className={`w-4 h-4 ${p.color}`} />
                  <span className="text-[9px] tracking-widest uppercase font-mono">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Handle</label>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourhandle"
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Profile URL (optional)</label>
              <Input
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://..."
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="flex-1 h-12 rounded-none border-white/10 bg-transparent text-foreground hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={addAccount}
                disabled={adding}
                className="flex-1 h-12 rounded-none bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-[0.2em] uppercase"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ClipperLockGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={load}
        reason="Lock in to link your social accounts."
      />
    </ClippersLayout>
  );
}

function Cell({ index, label, value, accent }: { index: string; label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="font-mono text-[9px] tracking-[0.25em] text-gold/70">{index}</span>
        <span className="text-[9px] text-muted-foreground tracking-[0.2em] uppercase font-semibold">{label}</span>
      </div>
      <div className={`font-display text-[30px] leading-none tabular-nums tracking-tight ${accent ? 'text-gold' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}