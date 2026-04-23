import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Loader2, Clock, Check, X as XIcon, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ClippersLayout from '@/components/clippers/ClippersLayout';
import ClipperLockGate from '@/components/clippers/ClipperLockGate';
import { Button } from '@/components/ui/button';
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
    if (!user) {
      setLoading(false);
      return;
    }
    const [pRes, wRes] = await Promise.all([
      supabase.from('clipper_profiles').select('total_earnings_cents').eq('user_id', user.id).maybeSingle(),
      supabase.from('clipper_withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    const earnings = pRes.data?.total_earnings_cents || 0;
    const paidOut = (wRes.data || [])
      .filter((w) => w.status !== 'rejected')
      .reduce((sum, w) => sum + w.amount_cents, 0);
    setBalance(Math.max(0, earnings - paidOut));
    setWithdrawals((wRes.data || []) as Withdrawal[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const submitRequest = async () => {
    if (!user) {
      setShowGate(true);
      return;
    }
    const amtCents = Math.round(parseFloat(amount) * 100);
    if (!amtCents || amtCents < MIN_PAYOUT_CENTS) {
      toast.error(`Minimum payout is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`);
      return;
    }
    if (amtCents > balance) {
      toast.error('Amount exceeds balance');
      return;
    }
    if (!destination.trim()) {
      toast.error('Enter a destination');
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from('clipper_withdrawals').insert({
      user_id: user.id,
      amount_cents: amtCents,
      method,
      destination: destination.trim(),
    });
    setRequesting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Withdrawal requested');
    setAmount('');
    setDestination('');
    setShowRequest(false);
    load();
  };

  const formatMoney = (c: number) => `$${(c / 100).toFixed(2)}`;
  const totalPaid = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount_cents, 0);

  return (
    <ClippersLayout title="CASHOUT">
      <section className="max-w-6xl mx-auto px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·04</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
            MIN {formatMoney(MIN_PAYOUT_CENTS)}
          </span>
        </div>
        <h1 className="font-display text-[56px] sm:text-[72px] leading-[0.85] tracking-tight">
          Get <span className="italic text-gold">paid.</span>
        </h1>
        <p className="text-[12px] text-muted-foreground mt-2 tracking-wider uppercase">Withdraw your clip earnings</p>
      </section>

      {/* Hero balance — editorial monolith */}
      <section className="border-y border-white/[0.06] relative overflow-hidden" style={{ background: 'hsl(0 0% 2%)' }}>
        {/* subtle gold tint */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(60% 80% at 80% 100%, hsl(var(--gold) / 0.08), transparent 70%)' }}
        />
        <div className="relative max-w-6xl mx-auto px-5 py-8 sm:py-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Wallet className="w-3 h-3 text-gold" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80 uppercase">Available Balance</span>
            </div>
            <p
              className="font-display text-[88px] sm:text-[120px] leading-[0.82] text-foreground tracking-tighter tabular-nums"
              style={{ textShadow: '0 0 40px hsl(var(--gold) / 0.15)' }}
            >
              <span className="text-gold">$</span>
              {(balance / 100).toFixed(2)}
            </p>
            <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mt-2">
              Lifetime paid · <span className="text-foreground tabular-nums">{formatMoney(totalPaid)}</span>
            </p>
          </div>
          <Button
            onClick={() => (user ? setShowRequest(true) : setShowGate(true))}
            disabled={!!user && balance < MIN_PAYOUT_CENTS}
            className="self-start sm:self-end h-12 px-7 rounded-none bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-[0.25em] uppercase"
            style={{ boxShadow: '0 8px 24px hsl(var(--gold) / 0.25)' }}
          >
            Cash Out <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 py-7 space-y-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">HISTORY</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground tabular-nums">
            {withdrawals.length.toString().padStart(2, '0')}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : !user || withdrawals.length === 0 ? (
          <div className="border border-white/[0.06] p-12 text-center">
            <Wallet className="w-7 h-7 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-[28px] tracking-tight mb-1">No withdrawals yet</p>
            <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
              {user ? 'Hit the minimum to cash out' : 'Lock in to request payouts'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {withdrawals.map((w, idx) => {
              const isPaid = w.status === 'paid';
              const isRej = w.status === 'rejected';
              const SI = isPaid ? Check : isRej ? XIcon : Clock;
              const sColor = isPaid ? 'text-emerald-400' : isRej ? 'text-destructive' : 'text-gold';
              return (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: idx * 0.03 }}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 w-7 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] tracking-[0.2em] font-mono uppercase ${sColor}`}>
                        <SI className="w-2.5 h-2.5" /> {w.status}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70">
                        {w.method}
                      </span>
                    </div>
                    <p className="font-display text-[22px] leading-none tracking-tight tabular-nums">
                      {formatMoney(w.amount_cents)}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/70 tracking-wider uppercase">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showRequest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] backdrop-blur-md flex items-end sm:items-center justify-center"
          style={{ background: 'hsl(0 0% 0% / 0.85)' }}
          onClick={() => setShowRequest(false)}
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
              <span className="font-mono text-[10px] tracking-[0.3em] text-gold/80">M·04 / CASHOUT</span>
              <h2 className="font-display text-[32px] leading-none tracking-tight mt-1">Request Payout</h2>
              <p className="text-[11px] text-muted-foreground tracking-wider uppercase mt-1">
                Available {formatMoney(balance)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-3 border text-[11px] font-mono tracking-[0.2em] uppercase transition-all active:opacity-70 ${
                    method === m.id ? 'border-gold bg-gold/10 text-gold' : 'border-white/[0.06] text-muted-foreground hover:border-gold/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Amount ($)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="10.00"
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold font-display text-2xl tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Destination</label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={METHODS.find((m) => m.id === method)?.placeholder}
                className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-gold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRequest(false)}
                className="flex-1 h-12 rounded-none border-white/10 bg-transparent text-foreground hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={requesting}
                className="flex-1 h-12 rounded-none bg-gold hover:bg-gold/90 text-gold-foreground font-display tracking-[0.2em] uppercase"
              >
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ClipperLockGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={load}
        reason="Lock in to request withdrawals."
      />
    </ClippersLayout>
  );
}