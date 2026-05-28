import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import RingsCoin from './RingsCoin';

export default function CompCancelledModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'comp_cancelled')
      .eq('read', false)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNotificationId(data[0].id);
          setOpen(true);
        }
      });
  }, [user]);

  const handleDismiss = async () => {
    setOpen(false);
    if (notificationId) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleDismiss(); }}>
      <DialogContent className="bg-[#0c0c0c] border border-white/10 w-[92vw] max-w-[360px] p-0 gap-0 rounded-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center gap-4">
          <RingsCoin size={64} spin />

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400 mb-1">
              Competition Cancelled
            </p>
            <h2
              className="text-[22px] font-black uppercase leading-tight text-white"
              style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
            >
              Light Yagami Edit Comp
            </h2>
          </div>

          <p className="text-[13px] text-white/60 leading-relaxed">
            This competition has been cancelled due to low submissions. We're sorry for the
            inconvenience.
          </p>

          <div className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
              Compensation
            </p>
            <div className="flex items-center justify-center gap-2">
              <RingsCoin size={18} />
              <span
                className="text-[28px] font-black text-amber-400 leading-none"
                style={{ fontFamily: 'Teko, Inter, system-ui, sans-serif' }}
              >
                1,000,000
              </span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-white/50">
                Rings
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-1">Added to your account</p>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl bg-white text-black text-[13px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
