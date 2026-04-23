import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, Clock, Check, X as XIcon, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
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

const METHODS = [
  { id: 'paypal', label: 'PayPal', placeholder: 'PayPal email' },
  { id: 'bank', label: 'Bank', placeholder: 'Account / IBAN' },
  { id: 'crypto', label: 'Crypto', placeholder: 'USDT wallet' },
];

const MIN_PAYOUT_CENTS = 1000;

export default function ClippersWithdrawalsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [method, setMethod] = useState('paypal');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
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

  const submitRequest = async () => {
    if (!user) { setShowGate(true); return; }
    const amtCents = Math.round(parseFloat(amount) * 100);
    if (!amtCents || amtCents < MIN_PAYOUT_CENTS) { toast.error(`Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`); return; }
    if (amtCents > balance) { toast.error('Amount exceeds balance'); return; }
    if (!destination.trim()) { toast.error('Enter a destination'); return; }
    setRequesting(true);
    const { error } = await supabase.from('clipper_withdrawals').insert({
      user_id: user.id, amount_cents: amtCents, method, destination: destination.trim(),
    });
    setRequesting(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Withdrawal requested');
    setAmount(''); setDestination(''); setShowRequest(false); load();
  };

  const formatMoney = (c: number) => `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalPaid = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount_cents, 0);
  const canCashOut = !!user && balance >= MIN_PAYOUT_CENTS;

  return (
    <ClippersLayout title="Cashout">
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
              disabled={!canCashOut}
              className="inline-flex items-center gap-1 h-11 px-5 rounded-full bg-white text-black text-[15px] font-semibold active:opacity-60 disabled:opacity-40 disabled:bg-[#48484A] disabled:text-[#8E8E93] transition-opacity"
            >
              Cash out <ArrowUpRight className="w-4 h-4" strokeWidth={2.8} />
            </button>
          </div>
          {!canCashOut && user && (
            <p className="text-[12px] text-[#8E8E93] mt-3">Minimum {formatMoney(MIN_PAYOUT_CENTS)} required to withdraw</p>
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
            <p className="text-[13px] text-[#8E8E93]">{user ? 'Hit the minimum to cash out' : 'Lock in to request payouts'}</p>
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
          <div>
            <p className="text-[13px] text-[#8E8E93] font-medium mb-2 px-1">Method</p>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className="h-11 text-[14px] font-semibold rounded-[10px] transition-all active:opacity-60"
                  style={{
                    background: method === m.id ? '#0A84FF' : 'rgba(118,118,128,0.24)',
                    color: '#fff',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Amount">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              placeholder="10.00"
              className="h-12 rounded-[10px] border-0 text-[20px] font-semibold text-white tabular-nums placeholder:text-[#48484A] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <Field label="Destination">
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={METHODS.find((m) => m.id === method)?.placeholder}
              className="h-11 rounded-[10px] border-0 text-[16px] text-white placeholder:text-[#8E8E93] focus-visible:ring-1 focus-visible:ring-[#0A84FF]"
              style={{ background: 'rgba(118, 118, 128, 0.24)' }}
            />
          </Field>
          <button
            onClick={submitRequest}
            disabled={requesting}
            className="w-full h-12 rounded-[14px] bg-[#0A84FF] text-white text-[17px] font-semibold active:opacity-60 disabled:opacity-50 flex items-center justify-center"
          >
            {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request payout'}
          </button>
        </Sheet>
      )}

      <ClipperLockGate open={showGate} onClose={() => setShowGate(false)} onSuccess={load} reason="Lock in to request withdrawals." />
    </ClippersLayout>
  );
}

function Sheet({ children, onClose, title, subtitle }: { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string }) {
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
        <div>
          <h2 className="text-[22px] font-bold text-white tracking-[-0.022em]">{title}</h2>
          {subtitle && <p className="text-[13px] text-[#8E8E93] mt-0.5">{subtitle}</p>}
        </div>
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
