import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const OG_ITEM_ID = '88ab63be-357e-4b09-9dc2-124a23caed3f';

/**
 * Silent first-signup hook.
 * No modal, no mascot. Just auto-grants the First Circle badge.
 */
export default function LoopyWelcomeModal() {
  const { user } = useAuth();
  const granted = useRef(false);

  useEffect(() => {
    const flag = sessionStorage.getItem('loopgate_just_signed_up');
    if (!flag || !user || granted.current) return;
    granted.current = true;
    sessionStorage.removeItem('loopgate_just_signed_up');

    // Silently grant First Circle badge + mark founding member
    Promise.all([
      supabase.from('shop_purchases').insert({
        user_id: user.id,
        item_id: OG_ITEM_ID,
        is_equipped: true,
      }),
      supabase.from('profiles').update({ is_founding_member: true } as any).eq('id', user.id),
    ]).catch(() => { /* swallow — non-critical */ });
  }, [user]);

  return null;
}
