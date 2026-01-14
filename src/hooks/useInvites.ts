import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Invite {
  id: string;
  invite_code: string;
  inviter_id: string;
  invitee_id: string | null;
  status: 'pending' | 'joined' | 'submitted';
  invite_sent_at: string;
  joined_at: string | null;
  first_submission_at: string | null;
}

interface InviteStats {
  total_sent: number;
  total_joined: number;
  total_submitted: number;
  xp_earned: number;
}

export function useInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [stats, setStats] = useState<InviteStats>({
    total_sent: 0,
    total_joined: 0,
    total_submitted: 0,
    xp_earned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const inviteList = data as Invite[];
      setInvites(inviteList);
      
      // Calculate stats
      const joined = inviteList.filter(i => i.status === 'joined' || i.status === 'submitted').length;
      const submitted = inviteList.filter(i => i.status === 'submitted').length;
      const xp = (inviteList.length * 20) + (joined * 50) + (submitted * 100);
      
      setStats({
        total_sent: inviteList.length,
        total_joined: joined,
        total_submitted: submitted,
        xp_earned: xp,
      });
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const createInvite = async (customCode?: string): Promise<string | null> => {
    if (!user) return null;
    
    setCreating(true);
    try {
      const params: { p_user_id: string; p_custom_code?: string } = { p_user_id: user.id };
      
      if (customCode && customCode.trim().length >= 4) {
        params.p_custom_code = customCode.trim();
      }
      
      const { data, error } = await supabase.rpc('create_invite', params);
      
      if (error) {
        if (error.message.includes('already taken')) {
          toast.error('Code already taken', { description: 'Try a different custom code' });
        } else {
          throw error;
        }
        return null;
      }
      
      const result = data?.[0];
      if (result?.invite_code) {
        toast.success('+20 XP', { description: 'Invite created!' });
        fetchInvites();
        return result.invite_code;
      }
      return null;
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error('Failed to create invite');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const redeemInvite = async (code: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .rpc('redeem_invite', { p_user_id: user.id, p_code: code });
      
      if (error) throw error;
      
      const result = data?.[0];
      if (result?.success) {
        toast.success('Invite redeemed!', { description: result.message });
        return true;
      } else {
        toast.error(result?.message || 'Failed to redeem invite');
        return false;
      }
    } catch (error) {
      console.error('Error redeeming invite:', error);
      toast.error('Failed to redeem invite');
      return false;
    }
  };

  const shareInvite = async (code: string) => {
    const shareUrl = `${window.location.origin}/auth?invite=${code}`;
    const shareText = `Join me on Loopgate and compete in editing events! Use my invite code: ${code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Loopgate',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Invite link copied!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Invite link copied!');
    }
  };

  return {
    invites,
    stats,
    loading,
    creating,
    createInvite,
    redeemInvite,
    shareInvite,
    refresh: fetchInvites,
  };
}

// Hook to check and trigger invite submission bonus
export function useInviteSubmissionBonus() {
  const { user } = useAuth();
  
  const checkSubmissionBonus = async (): Promise<number> => {
    if (!user) return 0;
    
    try {
      const { data, error } = await supabase
        .rpc('check_invite_submission_bonus', { p_user_id: user.id });
      
      if (error) throw error;
      
      if (data && data > 0) {
        toast.success(`Your inviter earned +${data} XP!`, { 
          description: 'Thanks for submitting within 24 hours!' 
        });
      }
      
      return data || 0;
    } catch (error) {
      console.error('Error checking invite submission bonus:', error);
      return 0;
    }
  };
  
  return { checkSubmissionBonus };
}
