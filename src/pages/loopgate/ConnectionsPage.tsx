import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Clock, Check, X, Loader2 } from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { useStartConversation } from '@/hooks/useDirectMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
 
 export default function ConnectionsPage() {
   const navigate = useNavigate();
   const {
     connections,
     pendingRequests,
     sentRequests,
     stats,
     loading,
     acceptRequest,
     rejectRequest,
     cancelRequest,
     removeConnection,
   } = useConnections();
  const { startConversation } = useStartConversation();
    const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent'>('connections');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [messageLoading, setMessageLoading] = useState<string | null>(null);
 
   const handleAccept = async (id: string) => {
     setActionLoading(id);
     await acceptRequest(id);
     setActionLoading(null);
   };
 
   const handleReject = async (id: string) => {
     setActionLoading(id);
     await rejectRequest(id);
     setActionLoading(null);
   };
 
   const handleCancel = async (id: string) => {
     setActionLoading(id);
     await cancelRequest(id);
     setActionLoading(null);
   };
 
   return (
     <div className="min-h-screen bg-background pb-24">
       {/* Header */}
       <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-border">
         <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
           <ArrowLeft size={18} className="text-muted-foreground" />
         </button>
         <div>
           <h1 className="font-display text-xl">Connections</h1>
           <p className="text-xs text-muted-foreground">
             {stats.weeklyRequestsRemaining} requests remaining this week
           </p>
         </div>
       </div>
 
       {/* Tab Navigation */}
       <div className="flex border-b border-border">
         <button
           onClick={() => setActiveTab('connections')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
             activeTab === 'connections'
               ? 'text-gold border-b-2 border-gold'
               : 'text-muted-foreground hover:text-white'
           }`}
         >
           <Users size={12} />
           {connections.length}
         </button>
         <button
           onClick={() => setActiveTab('requests')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
             activeTab === 'requests'
               ? 'text-gold border-b-2 border-gold'
               : 'text-muted-foreground hover:text-white'
           }`}
         >
           <UserPlus size={12} />
           Requests
           {pendingRequests.length > 0 && (
             <span className="ml-1 px-1.5 py-0.5 bg-gold text-black text-[9px] font-bold rounded-full">
               {pendingRequests.length}
             </span>
           )}
         </button>
         <button
           onClick={() => setActiveTab('sent')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
             activeTab === 'sent'
               ? 'text-gold border-b-2 border-gold'
               : 'text-muted-foreground hover:text-white'
           }`}
         >
           <Clock size={12} />
           Sent
           {sentRequests.length > 0 && (
             <span className="ml-1 text-muted-foreground">
               {sentRequests.length}
             </span>
           )}
         </button>
       </div>
 
       {/* Content */}
       {loading ? (
         <div className="flex items-center justify-center py-12">
           <Loader2 className="w-6 h-6 animate-spin text-gold" />
         </div>
       ) : (
         <div className="px-4 py-4 space-y-2">
           {activeTab === 'connections' && (
             connections.length === 0 ? (
               <div className="text-center py-12">
                 <Users size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-muted-foreground text-sm">No connections yet</p>
                 <p className="text-muted-foreground/60 text-xs mt-1">
                   Visit profiles and send connection requests
                 </p>
               </div>
             ) : (
               connections.map((c) => (
                 <div
                   key={c.id}
                   className="flex items-center gap-3 p-3 bg-surface-1 border border-border hover:border-border/80 transition-colors"
                 >
                   <button onClick={() => navigate(`/editor/${c.profile?.id}`)}>
                     <Avatar className="w-10 h-10 border border-border">
                       <AvatarImage src={c.profile?.avatar_url || undefined} />
                       <AvatarFallback className="bg-muted text-muted-foreground">
                         {c.profile?.username?.[0]?.toUpperCase() || '?'}
                       </AvatarFallback>
                     </Avatar>
                   </button>
                   <div className="flex-1 min-w-0">
                     <button
                       onClick={() => navigate(`/editor/${c.profile?.id}`)}
                       className="flex items-center gap-1.5 hover:text-gold transition-colors"
                     >
                       <span className="font-semibold text-sm truncate">
                         {c.profile?.display_name || c.profile?.username}
                       </span>
                       {c.profile?.verification_status && <VerifiedBadge size="sm" />}
                     </button>
                     <p className="text-xs text-muted-foreground">@{c.profile?.username}</p>
                   </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={messageLoading === c.profile?.id}
                      onClick={async () => {
                        if (!c.profile?.id) return;
                        setMessageLoading(c.profile.id);
                        const convId = await startConversation(c.profile.id);
                        setMessageLoading(null);
                        if (convId) navigate(`/messages/${convId}`);
                      }}
                      className="text-xs"
                    >
                      {messageLoading === c.profile?.id ? <Loader2 size={12} className="animate-spin" /> : 'Message'}
                    </Button>
                 </div>
               ))
             )
           )}
 
           {activeTab === 'requests' && (
             pendingRequests.length === 0 ? (
               <div className="text-center py-12">
                 <UserPlus size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-muted-foreground text-sm">No pending requests</p>
               </div>
             ) : (
               pendingRequests.map((c) => (
                 <div
                   key={c.id}
                   className="flex items-center gap-3 p-3 bg-surface-1 border border-border"
                 >
                   <button onClick={() => navigate(`/editor/${c.profile?.id}`)}>
                     <Avatar className="w-10 h-10 border border-border">
                       <AvatarImage src={c.profile?.avatar_url || undefined} />
                       <AvatarFallback className="bg-muted text-muted-foreground">
                         {c.profile?.username?.[0]?.toUpperCase() || '?'}
                       </AvatarFallback>
                     </Avatar>
                   </button>
                   <div className="flex-1 min-w-0">
                     <button
                       onClick={() => navigate(`/editor/${c.profile?.id}`)}
                       className="flex items-center gap-1.5 hover:text-gold transition-colors"
                     >
                       <span className="font-semibold text-sm truncate">
                         {c.profile?.display_name || c.profile?.username}
                       </span>
                       {c.profile?.verification_status && <VerifiedBadge size="sm" />}
                     </button>
                     <p className="text-xs text-muted-foreground">wants to connect</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => handleReject(c.id)}
                       disabled={actionLoading === c.id}
                       className="h-8 w-8 text-muted-foreground hover:text-destructive"
                     >
                       {actionLoading === c.id ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleAccept(c.id)}
                       disabled={actionLoading === c.id}
                       className="gap-1 text-xs"
                     >
                       <Check size={12} />
                       Accept
                     </Button>
                   </div>
                 </div>
               ))
             )
           )}
 
           {activeTab === 'sent' && (
             sentRequests.length === 0 ? (
               <div className="text-center py-12">
                 <Clock size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-muted-foreground text-sm">No pending requests</p>
               </div>
             ) : (
               sentRequests.map((c) => (
                 <div
                   key={c.id}
                   className="flex items-center gap-3 p-3 bg-surface-1 border border-border"
                 >
                   <button onClick={() => navigate(`/editor/${c.profile?.id}`)}>
                     <Avatar className="w-10 h-10 border border-border">
                       <AvatarImage src={c.profile?.avatar_url || undefined} />
                       <AvatarFallback className="bg-muted text-muted-foreground">
                         {c.profile?.username?.[0]?.toUpperCase() || '?'}
                       </AvatarFallback>
                     </Avatar>
                   </button>
                   <div className="flex-1 min-w-0">
                     <button
                       onClick={() => navigate(`/editor/${c.profile?.id}`)}
                       className="flex items-center gap-1.5 hover:text-gold transition-colors"
                     >
                       <span className="font-semibold text-sm truncate">
                         {c.profile?.display_name || c.profile?.username}
                       </span>
                       {c.profile?.verification_status && <VerifiedBadge size="sm" />}
                     </button>
                     <p className="text-xs text-muted-foreground">pending</p>
                   </div>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleCancel(c.id)}
                     disabled={actionLoading === c.id}
                     className="text-xs text-muted-foreground hover:text-destructive"
                   >
                     {actionLoading === c.id ? <Loader2 size={12} className="animate-spin" /> : 'Cancel'}
                   </Button>
                 </div>
               ))
             )
           )}
         </div>
       )}
     </div>
   );
 }