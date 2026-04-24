import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, Clock, Check, X as XIcon, ArrowUpRight, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  amount_cents: number;
  method: string;
  destination: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

type MethodId = 'paypal' | 'crypto';

const CRYPTO_NETWORKS = [
  { id: 'usdt_trc20', label: 'USDT (TRC-20)', placeholder: 'T-address' },
  { id: 'usdt_erc20', label: 'USDT (ERC-20)', placeholder: '0x address' },
  { id: 'btc',        label: 'Bitcoin (BTC)', placeholder: 'BTC address' },
] as const;
type CryptoNet = typeof CRYPTO_NETWORKS[number]['id'];

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const isPlausibleCryptoAddress = (s: string) => {
  const v = s.trim();
  // Permissive sanity check — block obvious garbage, real validation happens server-side at payout.
  if (v.length < 20 || v.length > 120) return false;
  return /^[A-Za-z0-9]+$/.test(v);
};

export default function ClippersWithdrawalsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [method, setMethod] = useState<MethodId>('paypal');
  const [cryptoNet, setCryptoNet] = useState<CryptoNet>('usdt_trc20');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [confirmDest, setConfirmDest] = useState('');
  const [acceptCrypto, setAcceptCrypto] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const [pRes, wRes] = await Promise.all([
      supabase.from('clipper_profiles').select('total_earnings_cents').eq('user_id', user.id).maybeSingle(),
      supabase.from('clipper_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    const earnings = pRes.data?.total_earnings_cents || 0;
    const paidOut = (wRes.data || []).filter((w) => w.status !== 'rejected').reduce((sum, w) => sum + w.amount_cents, 0);
    setBalance(Math.max(0, earnings - paidOut));
    setWithdrawals((wRes.data || []) as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Hide mission top bar + bottom nav while the payout sheet is open
  useEffect(() => {
    if (!showRequest) return;
    document.body.classList.add('hide-app-chrome');
    return () => document.body.classList.remove('hide-app-chrome');
  }, [showRequest]);

  // Close payout sheet on Escape key
  useEffect(() => {
    if (!showRequest) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowRequest(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showRequest]);

  const resetForm = () => {
    setAmount(''); setDestination(''); setConfirmDest(''); setAcceptCrypto(false); setMethod('paypal'); setCryptoNet('usdt_trc20');
  };

  const submitRequest = async () => {
    if (!user) { setShowGate(true); return; }
    const amtCents = Math.round(parseFloat(amount) * 100);
    if (!amtCents || amtCents <= 0) { toast.error('Enter an amount'); return; }
    if (amtCents > balance) { toast.error('Amount exceeds balance'); return; }
    const dest = destination.trim();
    if (!dest) { toast.error('Enter your payout destination'); return; }
    const cdest = confirmDest.trim();

    let storedDestination = dest;
    if (method === 'paypal') {
      if (!isValidEmail(dest)) { toast.error('Enter a valid PayPal email'); return; }
      if (dest.toLowerCase() !== cdest.toLowerCase()) { toast.error('Emails do not match'); return; }
      storedDestination = `paypal:${dest}`;
    } else {
      if (!isPlausibleCryptoAddress(dest)) { toast.error('That doesn’t look like a valid wallet address'); return; }
      if (dest !== cdest) { toast.error('Wallet addresses do not match'); return; }
      if (!acceptCrypto) { toast.error('Confirm you understand crypto payouts are irreversible'); return; }
      storedDestination = `${cryptoNet}:${dest}`;
    }

    setRequesting(true);
    const { error } = await supabase.from('clipper_withdrawals').insert({
      user_id: user.id, amount_cents: amtCents, method, destination: storedDestination,
    });
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Withdrawal requested');
    resetForm();
    setShowRequest(false);
    load();
  };

  const formatMoney = (c: number) => `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalPaid = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount_cents, 0);
  const canCashOut = !!user && balance > 0;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 pt-3 pb-4">
        <h1 className="font-apple-tight text-[34px] font-bold text-white leading-[1.05]">Cashout</h1>
      </section>

      {/* Balance hero — Apple Wallet inspired */}
      <section className="max-w-6xl mx-auto px-4 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[20px] p-6"
          style={{ background: 'linear-gradient(140deg, #1c1c1e 0%, #2c2c2e 60%, #1c1c1e 100%)' }}
        >
          <div
            aria-hidden
            className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,204,0,0.20) 0%, transparent 70%)' }}
          />
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-[#FFCC00]" strokeWidth={2.4} />
            <p className="text-[13px] text-[#8E8E93] font-medium">Available balance</p>
          </div>
          <p className="font-apple-tight text-[56px] sm:text-[72px] font-bold text-white leading-[0.95] tabular-nums">
            {formatMoney(balance)}
          </p>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
            <div>
              <p className="text-[11px] text-[#8E8E93] font-medium">Lifetime paid</p>
              <p className="text-[15px] font-semibold text-white tabular-nums mt-0.5">{formatMoney(totalPaid)}</p>
            </div>
            <button
              onClick={() => (user ? setShowRequest(true) : setShowGate(true))}
              disabled={!user}
              className="inline-flex items-center gap-1 h-11 px-5 rounded-full bg-white text-black text-[15px] font-semibold active:opacity-60 disabled:opacity-40 disabled:bg-[#48484A] disabled:text-[#8E8E93] transition-opacity"
            >
              {canCashOut ? 'Cash out' : 'Set up payout'} <ArrowUpRight className="w-4 h-4" strokeWidth={2.8} />
            </button>
          </div>
          {!canCashOut && user && (
            <p className="text-[12px] text-[#8E8E93] mt-3">No minimum — earn views to unlock cashout</p>
          )}
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.022em] mb-3 px-0.5">History</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-[16px] bg-[#1c1c1e] animate-pulse" />)}
          </div>
        ) : !user || withdrawals.length === 0 ? (
          <div className="rounded-[20px] p-10 text-center" style={{ background: '#1c1c1e' }}>
            <Wallet className="w-7 h-7 text-[#8E8E93] mx-auto mb-3" />
            <p className="text-[17px] font-semibold text-white mb-1">No withdrawals yet</p>
            <p className="text-[13px] text-[#8E8E93]">{user ? 'Cash out anytime — no minimum' : 'Lock in to request payouts'}</p>
          </div>
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: '#1c1c1e' }}>
            {withdrawals.map((w, idx) => {
              const isPaid = w.status === 'paid';
              const isRej = w.status === 'rejected';
              const SI = isPaid ? Check : isRej ? XIcon : Clock;
              const sColor = isPaid ? '#30D158' : isRej ? '#FF453A' : '#FFCC00';
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={idx === withdrawals.length - 1 ? {} : { borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${sColor}20` }}>
                    <SI className="w-[18px] h-[18px]" style={{ color: sColor }} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-white tracking-[-0.02em] truncate leading-tight tabular-nums">
                      {formatMoney(w.amount_cents)}
                    </p>
                    <p className="text-[13px] text-[#8E8E93] capitalize mt-0.5">{w.method} · {w.status}</p>
                  </div>
                  <p className="text-[13px] text-[#8E8E93] tabular-nums">
                    {new Date(w.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRequest && (
        <Sheet onClose={() => setShowRequest(false)} title="Request payout" subtitle={`Available ${formatMoney(balance)}`}>
          {/* Method picker — PayPal championed, Crypto secondary */}
          <div className="space-y-2">
            <p className="text-[13px] text-[#8E8E93] font-medium px-1">Payout method</p>
            <button
              onClick={() => setMethod('paypal')}
              className="w-full text-left rounded-[14px] p-3.5 transition-all active:opacity-70 flex items-start gap-3"
              style={{
                background: method === 'paypal' ? 'rgba(0,112,243,0.16)' : 'rgba(118,118,128,0.18)',
                boxShadow: method === 'paypal' ? 'inset 0 0 0 1px #0070F3' : 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#0070F3' }}>
                <span className="text-[15px] font-bold text-white tracking-tight">P</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-semibold text-white">PayPal</p>
                  <span className="inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-full text-[10px] font-bold" style={{ background: '#30D158', color: '#000' }}>
                    <Sparkles className="w-2.5 h-2.5" strokeWidth={3} /> RECOMMENDED
                  </span>
                </div>
                <p className="text-[12px] text-[#8E8E93] mt-0.5 leading-snug">Fast, traceable, fully reversible if anything goes wrong.</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: method === 'paypal' ? '#0070F3' : 'rgba(255,255,255,0.10)' }}>
                {method === 'paypal' && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
              </div>
            </button>

            <button
              onClick={() => setMethod('crypto')}
              className="w-full text-left rounded-[14px] p-3.5 transition-all active:opacity-70 flex items-start gap-3"
              style={{
                background: method === 'crypto' ? 'rgba(255,159,10,0.12)' : 'rgba(118,118,128,0.12)',
                boxShadow: method === 'crypto' ? 'inset 0 0 0 1px #FF9F0A' : 'inset 0 0 0 0.5px rgba(255,255,255,0.06)',
              }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1c1c1e' }}>
                <span className="text-[14px] font-bold text-[#FF9F0A]">₮</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white">Crypto</p>
                <p className="text-[12px] text-[#8E8E93] mt-0.5 leading-snug">Use only if PayPal isn’t available in your country. Sends are <span className="text-white">irreversible</span>.</p>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: method === 'crypto' ? '#FF9F0A' : 'rgba(255,255,255,0.10)' }}>
                {method === 'crypto' && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3.5} />}
              </div>
            </button>
          </div>

          <Field label="Amount">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="10.00"
              className="h-12 rounded-[10px] border-0 text-[20px] font-semibold text-white tabular-nums placeholder:text-[#48484A] focus-visible:ring-1 focus-visible:ring-[#D4A857]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>

          {method === 'paypal' ? (
            <>
              <Field label="PayPal email">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0070F3]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </Field>
              <Field label="Confirm email">
                <Input
                  value={confirmDest}
                  onChange={(e) => setConfirmDest(e.target.value)}
                  type="email"
                  autoComplete="off"
                  inputMode="email"
                  placeholder="you@email.com"
                  className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0070F3]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </Field>
              <div className="flex items-start gap-2 px-1">
                <ShieldCheck className="w-4 h-4 text-[#30D158] mt-0.5 shrink-0" strokeWidth={2.5} />
                <p className="text-[12px] text-[#8E8E93] leading-snug">
                  Use the email tied to your PayPal account. Wrong emails delay payouts up to 7 days.
                </p>
              </div>
            </>
          ) : (
            <>
              <Field label="Network">
                <div className="grid grid-cols-3 gap-1.5">
                  {CRYPTO_NETWORKS.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setCryptoNet(n.id)}
                      className="h-11 text-[12px] font-semibold rounded-[10px] transition-all active:opacity-60 px-1"
                      style={{
                        background: cryptoNet === n.id ? '#FF9F0A' : 'rgba(118,118,128,0.24)',
                        color: cryptoNet === n.id ? '#000' : '#fff',
                      }}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Wallet address">
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={CRYPTO_NETWORKS.find((n) => n.id === cryptoNet)?.placeholder}
                  className="h-11 rounded-[10px] border-0 text-[14px] font-mono text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#FF9F0A]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </Field>
              <Field label="Confirm wallet address">
                <Input
                  value={confirmDest}
                  onChange={(e) => setConfirmDest(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Paste again"
                  className="h-11 rounded-[10px] border-0 text-[14px] font-mono text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#FF9F0A]"
                  style={{ background: 'rgba(118, 118, 128, 0.24)' }}
                />
              </Field>
              <button
                type="button"
                onClick={() => setAcceptCrypto((v) => !v)}
                className="w-full text-left flex items-start gap-2.5 rounded-[12px] p-3"
                style={{ background: 'rgba(255,159,10,0.10)', boxShadow: 'inset 0 0 0 0.5px rgba(255,159,10,0.35)' }}
              >
                <div className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: acceptCrypto ? '#FF9F0A' : 'rgba(255,255,255,0.10)' }}>
                  {acceptCrypto && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3.5} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F0A]" strokeWidth={2.5} />
                    <p className="text-[12px] font-semibold text-white">I understand crypto sends are final</p>
                  </div>
                  <p className="text-[11px] text-[#8E8E93] leading-snug mt-0.5">
                    Wrong network or address = lost funds. Loopgate cannot recover or refund crypto payouts.
                  </p>
                </div>
              </button>
            </>
          )}

          <button
            onClick={submitRequest}
            disabled={requesting}
            className="w-full h-12 rounded-[14px] text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
            style={{ background: method === 'paypal' ? '#0070F3' : '#FF9F0A', color: method === 'paypal' ? '#fff' : '#000' }}
          >
            {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request payout'}
          </button>
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to request withdrawals." />
    </>
  );
}

function Sheet({ children, onClose, title, subtitle }: { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string }) {
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
        style={{
          background: '#1c1c1e',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - 16px)',
        }}
      >
        <div className="px-5 pt-3 pb-3 shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/25 mx-auto sm:hidden mb-3" />
          <h2 className="text-[22px] font-bold text-white tracking-[-0.022em]">{title}</h2>
          {subtitle && <p className="text-[13px] text-[#8E8E93] mt-0.5">{subtitle}</p>}
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
