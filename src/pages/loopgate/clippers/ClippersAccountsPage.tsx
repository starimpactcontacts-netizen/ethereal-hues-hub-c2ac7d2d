import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, ExternalLink, Trash2, Loader2, Youtube, Instagram, Music2, BadgeCheck, ShieldCheck, Copy, Camera, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LinkedAcc {
  id: string;
  platform: string;
  handle: string;
  profile_url: string | null;
  follower_count: number | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: '#FFFFFF' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF453A' },
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
  const [verifying, setVerifying] = useState<LinkedAcc | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('clipper_linked_accounts')
      .select('id, platform, handle, profile_url, follower_count, is_verified, verified_at, created_at')
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

  const refreshStats = async (acc: LinkedAcc) => {
    setRefreshingId(acc.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-clipper-account', {
        body: { action: 'fetch-stats', accountId: acc.id },
      });
      if (error) throw error;
      if (data?.followers != null) {
        setAccounts((arr) => arr.map((x) => (x.id === acc.id ? { ...x, follower_count: data.followers } : x)));
        toast.success(`${formatFollowers(data.followers)} followers`);
      } else {
        toast.error("Couldn't read followers — profile might be private");
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch stats');
    } finally {
      setRefreshingId(null);
    }
  };

  const verifiedCount = accounts.filter((a) => a.is_verified).length;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4 flex items-end justify-between">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Linked</h1>
        <button
          onClick={() => (user ? setShowAdd(true) : setShowGate(true))}
          className="flex items-center gap-1 h-8 px-3 rounded-full bg-[#D4A857] text-white text-[14px] font-semibold active:opacity-60"
        >
          <Plus className="w-[15px] h-[15px]" strokeWidth={2.8} /> Link
        </button>
      </section>

      <section className="max-w-6xl mx-auto px-4 mb-5">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Linked" value={accounts.length.toString()} />
          <StatCard label="Verified" value={verifiedCount.toString()} accent="#D4A857" />
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
                      {a.is_verified && <BadgeCheck className="w-4 h-4 text-[#D4A857] flex-shrink-0" fill="#D4A857" stroke="#000" strokeWidth={2} />}
                    </div>
                    <p className="text-[12px] text-[#8E8E93] mt-0.5 flex items-center gap-1.5">
                      <span>{meta?.label || a.platform}</span>
                      {a.follower_count != null && a.follower_count > 0 && (
                        <>
                          <span className="text-[#48484a]">·</span>
                          <span className="text-white/80 font-semibold tabular-nums">{formatFollowers(a.follower_count)}</span>
                          <span className="text-[#8E8E93]">followers</span>
                        </>
                      )}
                    </p>
                  </div>
                  {!a.is_verified && (
                    <button
                      onClick={() => setVerifying(a)}
                      className="h-7 px-2.5 rounded-full bg-[#D4A857] text-white text-[12px] font-semibold active:opacity-60 flex items-center gap-1"
                    >
                      <ShieldCheck className="w-[13px] h-[13px]" strokeWidth={2.6} /> Verify
                    </button>
                  )}
                  <button
                    onClick={() => refreshStats(a)}
                    disabled={refreshingId === a.id}
                    aria-label="Refresh stats"
                    className="text-[#8E8E93] active:text-white p-1.5 disabled:opacity-50"
                  >
                    {refreshingId === a.id ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <RefreshCw className="w-[15px] h-[15px]" />}
                  </button>
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
                    background: platform === p.id ? '#D4A857' : 'rgba(118,118,128,0.24)',
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
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <Field label="Profile URL (optional)">
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://..."
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <button
            onClick={addAccount}
            disabled={adding}
            className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link account'}
          </button>
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to link your social accounts." />

      {verifying && (
        <VerifySheet
          account={verifying}
          onClose={() => setVerifying(null)}
          onVerified={(updates) => {
            setAccounts((arr) => arr.map((x) => (x.id === verifying.id ? { ...x, ...updates } : x)));
            setVerifying(null);
          }}
        />
      )}
    </>
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
  useEffect(() => {
    const nav = document.querySelector('[data-clippers-bottom-nav]') as HTMLElement | null;
    const prev = nav?.style.display;
    if (nav) nav.style.display = 'none';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      if (nav) nav.style.display = prev || '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center font-apple"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] flex flex-col"
        style={{ background: '#1c1c1e', maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)' }}
      >
        <div className="px-5 pt-3 pb-3 shrink-0 relative">
          <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden mb-4" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] pr-10 pt-1">{title}</h2>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
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

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function VerifySheet({
  account,
  onClose,
  onVerified,
}: {
  account: LinkedAcc;
  onClose: () => void;
  onVerified: (updates: Partial<LinkedAcc>) => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const expired = code != null && remaining <= 0;

  const startVerify = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-clipper-account', {
        body: { action: 'start-verify', accountId: account.id },
      });
      if (error) throw error;
      if (data?.code) {
        setCode(data.code);
        setExpiresAt(new Date(data.expiresAt).getTime());
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to start');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied');
    } catch {}
  };

  const onScreenshot = async (file: File) => {
    if (!code) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Screenshot too large (max 8MB)');
      return;
    }
    setSubmitting(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = () => rej(reader.error);
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('verify-clipper-account', {
        body: { action: 'submit-screenshot', accountId: account.id, screenshotBase64: dataUrl },
      });
      if (error) throw error;
      if (data?.verified) {
        toast.success('Verified! 🎉');
        onVerified({
          is_verified: true,
          verified_at: new Date().toISOString(),
          follower_count: data.followers ?? account.follower_count,
        });
      } else {
        toast.error(data?.message || 'Code not found in screenshot');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const platformLabel =
    account.platform === 'tiktok' ? 'TikTok' : account.platform === 'instagram' ? 'Instagram' : 'YouTube';

  return (
    <Sheet onClose={onClose} title={`Verify @${account.handle}`}>
      {!code ? (
        <>
          <div className="rounded-[14px] p-3.5 space-y-2" style={{ background: 'rgba(118,118,128,0.18)' }}>
            <Step n={1} text={`We'll generate a one-time code`} />
            <Step n={2} text={`Paste it into your ${platformLabel} bio`} />
            <Step n={3} text="Upload a screenshot within 5 minutes" />
            <Step n={4} text="Get your verified badge instantly" />
          </div>
          <button
            onClick={startVerify}
            disabled={generating}
            className="w-full h-12 rounded-[14px] bg-[#D4A857] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate code'}
          </button>
        </>
      ) : (
        <>
          <div
            className="rounded-[16px] p-4 flex flex-col items-center gap-2"
            style={{ background: 'rgba(212,168,87,0.12)', border: '0.5px solid rgba(212,168,87,0.35)' }}
          >
            <span className="text-[11px] uppercase tracking-[0.12em] text-[#D4A857] font-bold">Your code</span>
            <p className="font-apple-tight text-[34px] font-bold text-white tracking-[-0.02em] tabular-nums select-all">
              {code}
            </p>
            <button
              onClick={copyCode}
              className="h-8 px-3 rounded-full bg-white/10 text-white text-[12px] font-semibold flex items-center gap-1.5 active:opacity-60"
            >
              <Copy className="w-[13px] h-[13px]" /> Copy
            </button>
            <p className={`text-[12px] font-semibold tabular-nums mt-1 ${expired ? 'text-[#FF453A]' : 'text-[#8E8E93]'}`}>
              {expired
                ? 'Code expired'
                : `Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
            </p>
          </div>

          <div className="rounded-[14px] p-3 space-y-1.5" style={{ background: 'rgba(118,118,128,0.18)' }}>
            <p className="text-[13px] text-white font-semibold">Steps</p>
            <Step n={1} text={`Paste the code into your ${platformLabel} bio`} />
            <Step n={2} text="Save the bio change" />
            <Step n={3} text="Take a screenshot of your full profile (bio visible)" />
            <Step n={4} text="Upload it below" />
          </div>

          <label
            className={`block w-full h-12 rounded-[14px] text-white text-[16px] font-semibold flex items-center justify-center gap-2 cursor-pointer active:opacity-60 ${
              expired || submitting ? 'opacity-50 pointer-events-none' : ''
            }`}
            style={{ background: '#D4A857' }}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-[17px] h-[17px]" />}
            {submitting ? 'Verifying…' : 'Upload screenshot'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={expired || submitting}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onScreenshot(f);
                e.target.value = '';
              }}
            />
          </label>

          {expired && (
            <button
              onClick={startVerify}
              disabled={generating}
              className="w-full h-10 rounded-[12px] bg-white/10 text-white text-[14px] font-semibold active:opacity-60"
            >
              {generating ? 'Generating…' : 'Generate new code'}
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="shrink-0 w-[18px] h-[18px] rounded-full bg-[#D4A857] text-black text-[11px] font-bold flex items-center justify-center mt-[1px]"
      >
        {n}
      </span>
      <p className="text-[13px] text-white/85 leading-snug">{text}</p>
    </div>
  );
}
