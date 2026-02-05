 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';
 import { toast } from 'sonner';
 
 export interface Connection {
   id: string;
   sender_id: string;
   receiver_id: string;
   status: 'pending' | 'accepted' | 'rejected';
   created_at: string;
   responded_at: string | null;
   // Joined profile data
   profile?: {
     id: string;
     username: string;
     display_name: string | null;
     avatar_url: string | null;
     verification_status: boolean;
   };
 }
 
 export interface ConnectionStats {
   connectionCount: number;
   pendingReceived: number;
   pendingSent: number;
   weeklyRequestsRemaining: number;
   weekResetsAt: Date;
 }
 
 const WEEKLY_LIMIT = 100;
 
 function getWeekStart(): string {
   const now = new Date();
   const dayOfWeek = now.getDay();
   const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
   const monday = new Date(now.setDate(diff));
   monday.setHours(0, 0, 0, 0);
   return monday.toISOString().split('T')[0];
 }
 
 function getNextWeekStart(): Date {
   const weekStart = new Date(getWeekStart());
   weekStart.setDate(weekStart.getDate() + 7);
   return weekStart;
 }
 
 export function useConnections() {
   const { user } = useAuth();
   const [connections, setConnections] = useState<Connection[]>([]);
   const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
   const [sentRequests, setSentRequests] = useState<Connection[]>([]);
   const [stats, setStats] = useState<ConnectionStats>({
     connectionCount: 0,
     pendingReceived: 0,
     pendingSent: 0,
     weeklyRequestsRemaining: WEEKLY_LIMIT,
     weekResetsAt: getNextWeekStart(),
   });
   const [loading, setLoading] = useState(true);
 
   const fetchConnections = useCallback(async () => {
     if (!user) return;
 
     try {
       // Fetch accepted connections
       const { data: acceptedData } = await supabase
         .from('connections')
         .select('*')
         .eq('status', 'accepted')
         .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
 
       // Fetch pending requests received
       const { data: pendingData } = await supabase
         .from('connections')
         .select('*')
         .eq('receiver_id', user.id)
         .eq('status', 'pending');
 
       // Fetch pending requests sent
       const { data: sentData } = await supabase
         .from('connections')
         .select('*')
         .eq('sender_id', user.id)
         .eq('status', 'pending');
 
       // Fetch weekly limit
       const weekStart = getWeekStart();
       const { data: limitData } = await supabase
         .from('connection_request_limits')
         .select('requests_sent')
         .eq('user_id', user.id)
         .eq('week_start', weekStart)
         .single();
 
       const requestsSent = limitData?.requests_sent || 0;
 
       // Enrich connections with profile data
       const enrichWithProfiles = async (items: Connection[], isReceived: boolean) => {
         if (!items || items.length === 0) return [];
         
         const userIds = items.map(c => isReceived ? c.sender_id : c.receiver_id);
         const { data: profiles } = await supabase
           .from('profiles')
           .select('id, username, display_name, avatar_url, verification_status')
           .in('id', userIds);
 
         return items.map(c => ({
           ...c,
           profile: profiles?.find(p => p.id === (isReceived ? c.sender_id : c.receiver_id)),
         }));
       };
 
       // For accepted connections, we need to get the OTHER person's profile
       const enrichedAccepted = await Promise.all(
         (acceptedData || []).map(async (c) => {
           const otherId = c.sender_id === user.id ? c.receiver_id : c.sender_id;
           const { data: profile } = await supabase
             .from('profiles')
             .select('id, username, display_name, avatar_url, verification_status')
             .eq('id', otherId)
             .single();
           return { ...c, profile } as Connection;
         })
       );
 
       const enrichedPending = await enrichWithProfiles(pendingData as Connection[] || [], true);
       const enrichedSent = await enrichWithProfiles(sentData as Connection[] || [], false);
 
       setConnections(enrichedAccepted);
       setPendingRequests(enrichedPending);
       setSentRequests(enrichedSent);
       setStats({
         connectionCount: enrichedAccepted.length,
         pendingReceived: enrichedPending.length,
         pendingSent: enrichedSent.length,
         weeklyRequestsRemaining: Math.max(0, WEEKLY_LIMIT - requestsSent),
         weekResetsAt: getNextWeekStart(),
       });
     } catch (error) {
       console.error('Error fetching connections:', error);
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   // Send connection request
   const sendRequest = async (receiverId: string): Promise<boolean> => {
     if (!user) {
       toast.error('Please log in to connect');
       return false;
     }
 
     if (receiverId === user.id) {
       toast.error("You can't connect with yourself");
       return false;
     }
 
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
       toast.error(`Weekly limit reached. Resets ${getNextWeekStart().toLocaleDateString()}`);
       return false;
     }
 
     // Check if connection already exists
     const { data: existing } = await supabase
       .from('connections')
       .select('id, status')
       .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
       .single();
 
     if (existing) {
       if (existing.status === 'accepted') {
         toast.info('Already connected!');
       } else if (existing.status === 'pending') {
         toast.info('Request already pending');
       } else {
         toast.info('Connection was previously declined');
       }
       return false;
     }
 
     // Create connection request
     const { error } = await supabase
       .from('connections')
       .insert({ sender_id: user.id, receiver_id: receiverId });
 
     if (error) {
       console.error('Error sending connection request:', error);
       toast.error('Failed to send request');
       return false;
     }
 
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
     fetchConnections();
     return true;
   };
 
   // Accept connection request
   const acceptRequest = async (connectionId: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('connections')
       .update({ status: 'accepted' })
       .eq('id', connectionId)
       .eq('receiver_id', user.id);
 
     if (error) {
       console.error('Error accepting request:', error);
       toast.error('Failed to accept request');
       return false;
     }
 
     toast.success('Connection accepted!');
     fetchConnections();
     return true;
   };
 
   // Reject connection request
   const rejectRequest = async (connectionId: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('connections')
       .update({ status: 'rejected' })
       .eq('id', connectionId)
       .eq('receiver_id', user.id);
 
     if (error) {
       console.error('Error rejecting request:', error);
       toast.error('Failed to reject request');
       return false;
     }
 
     toast.info('Request declined');
     fetchConnections();
     return true;
   };
 
   // Cancel sent request
   const cancelRequest = async (connectionId: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('connections')
       .delete()
       .eq('id', connectionId)
       .eq('sender_id', user.id);
 
     if (error) {
       console.error('Error canceling request:', error);
       toast.error('Failed to cancel request');
       return false;
     }
 
     toast.info('Request cancelled');
     fetchConnections();
     return true;
   };
 
   // Remove connection
   const removeConnection = async (connectionId: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('connections')
       .delete()
       .eq('id', connectionId);
 
     if (error) {
       console.error('Error removing connection:', error);
       toast.error('Failed to remove connection');
       return false;
     }
 
     toast.info('Connection removed');
     fetchConnections();
     return true;
   };
 
   // Check connection status with a specific user
   const getConnectionStatus = async (targetUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'connected'> => {
     if (!user || targetUserId === user.id) return 'none';
 
     const { data } = await supabase
       .from('connections')
       .select('sender_id, receiver_id, status')
       .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
       .single();
 
     if (!data) return 'none';
     if (data.status === 'accepted') return 'connected';
     if (data.status === 'pending') {
       return data.sender_id === user.id ? 'pending_sent' : 'pending_received';
     }
     return 'none';
   };
 
   useEffect(() => {
     fetchConnections();
   }, [fetchConnections]);
 
   // Real-time subscription
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel('connections-changes')
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'connections',
           filter: `sender_id=eq.${user.id}`,
         },
         () => fetchConnections()
       )
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'connections',
           filter: `receiver_id=eq.${user.id}`,
         },
         () => fetchConnections()
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, fetchConnections]);
 
   return {
     connections,
     pendingRequests,
     sentRequests,
     stats,
     loading,
     sendRequest,
     acceptRequest,
     rejectRequest,
     cancelRequest,
     removeConnection,
     getConnectionStatus,
     refresh: fetchConnections,
   };
 }