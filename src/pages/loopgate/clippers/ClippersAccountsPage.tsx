import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, ExternalLink, Trash2, Loader2, Youtube, Instagram, Music2, Twitter, Facebook } from 'lucide-react';
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

  const grouped = PLATFORMS.map((p) => ({
    ...p,
    accounts: accounts.filter((a) => a.platform === p.id),
  })).filter((g) => g.accounts.length > 0);

  return (
    <ClippersLayout title="LINKED">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="font-display text-3xl mb-1">Linked Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Connect socials so we can verify your clips for payouts.
          </p>
        </div>

        <Button
          onClick={() => (user ? setShowAdd(true) : setShowGate(true))}
          className="w-full h-12 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 font-display tracking-wide"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface-1 border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !user || accounts.length === 0 ? (
          <div className="bg-surface-1 border border-border rounded-2xl p-10 text-center">
            <Link2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display mb-1">No accounts linked</p>
            <p className="text-sm text-muted-foreground">
              {user ? 'Add your TikTok, IG, or YouTube to start.' : 'Lock in to link your socials.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.id} className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-8 h-8 rounded-md bg-surface-0 flex items-center justify-center">
                    <g.icon className={`w-4 h-4 ${g.color}`} />
                  </div>
                  <span className="font-display">{g.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {g.accounts.length} account{g.accounts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {g.accounts.map((a) => (
                    <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-display truncate">@{a.handle}</p>
                          {a.profile_url && (
                            <a href={a.profile_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${a.is_verified ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                          {a.is_verified ? `Verified ${new Date(a.verified_at!).toLocaleDateString()}` : 'Pending verification'}
                        </p>
                      </div>
                      <button
                        onClick={() => unlink(a.id)}
                        className="px-3 py-1.5 text-xs text-destructive border border-destructive/40 rounded-lg hover:bg-destructive/10 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Unlink
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setShowAdd(false)}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-1 border border-border sm:rounded-2xl rounded-t-3xl p-6 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <h2 className="font-display text-2xl">Add Account</h2>

            <div className="grid grid-cols-5 gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                    platform === p.id ? 'border-gold bg-gold/10' : 'border-border bg-surface-0 hover:border-gold/40'
                  }`}
                >
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                  <span className="text-[10px] tracking-wide">{p.label}</span>
                </button>
              ))}
            </div>

            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              className="h-12 bg-surface-0"
            />
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="Profile URL (optional)"
              className="h-12 bg-surface-0"
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1 h-11">
                Cancel
              </Button>
              <Button onClick={addAccount} disabled={adding} className="flex-1 h-11 bg-gold hover:bg-gold/90 text-gold-foreground">
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