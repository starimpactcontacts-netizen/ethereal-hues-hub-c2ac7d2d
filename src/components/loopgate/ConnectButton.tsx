 import { useState, useEffect } from 'react';
 import { UserPlus, UserCheck, Clock, X, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 
 interface ConnectButtonProps {
   targetUserId: string;
   variant?: 'default' | 'compact' | 'icon';
   className?: string;
 }
 
interface ConnectionData {
  status: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  connectionId: string | null;
}

const WEEKLY_LIMIT = 100;

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}
 
 export default function ConnectButton({ targetUserId, variant = 'default', className }: ConnectButtonProps) {
   const { user } = useAuth();
  const [data, setData] = useState<ConnectionData>({ status: 'none', connectionId: null });
  const [weeklyRemaining, setWeeklyRemaining] = useState(WEEKLY_LIMIT);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState(false);
 
   useEffect(() => {
    const fetchStatus = async () => {
       if (!user || targetUserId === user.id) {
         setLoading(false);
         return;
       }

      // Check connection status
      const { data: connData } = await supabase
        .from('connections')
        .select('id, sender_id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .single();

      if (connData) {
        if (connData.status === 'accepted') {
          setData({ status: 'connected', connectionId: connData.id });
        } else if (connData.status === 'pending') {
          setData({
            status: connData.sender_id === user.id ? 'pending_sent' : 'pending_received',
            connectionId: connData.id,
          });
        } else {
          setData({ status: 'none', connectionId: null });
        }
      } else {
        setData({ status: 'none', connectionId: null });
      }

      // Check weekly limit
      const weekStart = getWeekStart();
      const { data: limitData } = await supabase
        .from('connection_request_limits')
        .select('requests_sent')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      setWeeklyRemaining(Math.max(0, WEEKLY_LIMIT - (limitData?.requests_sent || 0)));
       setLoading(false);
     };
    fetchStatus();
  }, [user, targetUserId]);
 
   // Don't show button for own profile or when not logged in
   if (!user || targetUserId === user.id) return null;
 
   const handleConnect = async () => {
    if (!user) return;
     setActionLoading(true);

    // Check weekly limit
    const weekStart = getWeekStart();
    const { data: limitData } = await supabase
      .from('connection_request_limits')
      .select('requests_sent')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single();

    const requestsSent = limitData?.requests_sent || 0;
    if (requestsSent >= WEEKLY_LIMIT) {
      toast.error('Weekly limit reached');
      setActionLoading(false);
      return;
    }

    // Create connection
    const { data: newConn, error } = await supabase
      .from('connections')
      .insert({ sender_id: user.id, receiver_id: targetUserId })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to send request');
      setActionLoading(false);
      return;
    }

    // Get sender's profile info for notification
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    // Create notification for recipient
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `@${senderProfile?.username || 'Someone'} wants to connect with you`,
      data: { sender_id: user.id, connection_id: newConn.id }
    });

    // Update weekly limit
    await supabase
      .from('connection_request_limits')
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        requests_sent: requestsSent + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' });

    toast.success('Connection request sent!');
    setData({ status: 'pending_sent', connectionId: newConn.id });
    setWeeklyRemaining(prev => Math.max(0, prev - 1));
     setActionLoading(false);
   };
 
   const handleAccept = async () => {
    if (!data.connectionId) return;
     setActionLoading(true);

    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', data.connectionId);

    if (error) {
      toast.error('Failed to accept');
      setActionLoading(false);
      return;
    }

    // Get the connection to find the sender
    const { data: connData } = await supabase
      .from('connections')
      .select('sender_id')
      .eq('id', data.connectionId)
      .single();

    if (connData) {
      // Get accepter's profile info
      const { data: accepterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      // Notify the original sender that their request was accepted
      await supabase.from('notifications').insert({
        user_id: connData.sender_id,
        type: 'connection_accepted',
        title: 'Connection Accepted!',
        message: `@${accepterProfile?.username || 'Someone'} accepted your connection request`,
        data: { user_id: user.id, connection_id: data.connectionId }
      });
    }

    toast.success('Connected!');
    setData({ status: 'connected', connectionId: data.connectionId });
     setActionLoading(false);
   };
 
   const handleCancel = async () => {
    if (!data.connectionId) return;
     setActionLoading(true);

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', data.connectionId);

    if (error) {
      toast.error('Failed to cancel');
      setActionLoading(false);
      return;
    }

    toast.info('Request cancelled');
    setData({ status: 'none', connectionId: null });
     setActionLoading(false);
   };
 
   if (loading) {
     return (
       <Button variant="outline" size="sm" disabled className={className}>
         <Loader2 size={14} className="animate-spin" />
       </Button>
     );
   }
 
   // Icon-only variant
   if (variant === 'icon') {
    if (data.status === 'connected') {
       return (
         <Button
           variant="ghost"
           size="icon"
          className={cn('h-8 w-8 text-emerald-500', className)}
           disabled
         >
           <UserCheck size={16} />
         </Button>
       );
     }
 
    if (data.status === 'pending_sent') {
       return (
         <Button
           variant="ghost"
           size="icon"
           className={cn('h-8 w-8 text-gold', className)}
           onClick={handleCancel}
           disabled={actionLoading}
         >
           {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
         </Button>
       );
     }
 
    if (data.status === 'pending_received') {
       return (
         <Button
           variant="ghost"
           size="icon"
          className={cn('h-8 w-8 text-sky-400 animate-pulse', className)}
           onClick={handleAccept}
           disabled={actionLoading}
         >
           {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
         </Button>
       );
     }
 
     return (
       <Button
         variant="ghost"
         size="icon"
         className={cn('h-8 w-8 text-muted-foreground hover:text-white', className)}
         onClick={handleConnect}
        disabled={actionLoading || weeklyRemaining <= 0}
       >
         {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
       </Button>
     );
   }
 
   // Compact variant
   if (variant === 'compact') {
    if (data.status === 'connected') {
       return (
        <span className={cn('inline-flex items-center gap-1 text-xs text-emerald-500', className)}>
           <UserCheck size={12} />
           Connected
         </span>
       );
     }
 
    if (data.status === 'pending_sent') {
       return (
         <button
           onClick={handleCancel}
           disabled={actionLoading}
          className={cn('inline-flex items-center gap-1 text-xs text-gold hover:text-destructive transition-colors', className)}
         >
           {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
           Pending
         </button>
       );
     }
 
    if (data.status === 'pending_received') {
       return (
         <button
           onClick={handleAccept}
           disabled={actionLoading}
          className={cn('inline-flex items-center gap-1 text-xs text-sky-400 hover:text-emerald-400 transition-colors animate-pulse', className)}
         >
           {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
           Accept
         </button>
       );
     }
 
     return (
       <button
         onClick={handleConnect}
        disabled={actionLoading || weeklyRemaining <= 0}
         className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50', className)}
       >
         {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
         Connect
       </button>
     );
   }
 
   // Default variant - full button
  if (data.status === 'connected') {
     return (
       <Button
         variant="outline"
         size="sm"
        className={cn('gap-1.5 text-emerald-500 border-emerald-500/30', className)}
         disabled
       >
         <UserCheck size={14} />
         Connected
       </Button>
     );
   }
 
  if (data.status === 'pending_sent') {
     return (
       <Button
         variant="outline"
         size="sm"
        className={cn('gap-1.5 text-gold border-gold/30 hover:text-destructive hover:border-destructive/30', className)}
         onClick={handleCancel}
         disabled={actionLoading}
       >
         {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
         Pending
       </Button>
     );
   }
 
  if (data.status === 'pending_received') {
     return (
       <Button
         variant="outline"
         size="sm"
        className={cn('gap-1.5 text-sky-400 border-sky-400/30 animate-pulse', className)}
         onClick={handleAccept}
         disabled={actionLoading}
       >
         {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
         Accept
       </Button>
     );
   }
 
   return (
     <Button
       variant="outline"
       size="sm"
       className={cn('gap-1.5', className)}
       onClick={handleConnect}
      disabled={actionLoading || weeklyRemaining <= 0}
     >
       {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
       Connect
     </Button>
   );
 }