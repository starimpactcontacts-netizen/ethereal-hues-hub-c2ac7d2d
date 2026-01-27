import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Users, Send, Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BattleInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  battleId: string;
  challengerUsername: string;
}

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  league: string;
}

const MAX_INVITES = 100;

export default function BattleInviteModal({ 
  isOpen, 
  onClose, 
  battleId,
  challengerUsername 
}: BattleInviteModalProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);

  // Fetch already invited users
  useEffect(() => {
    if (!isOpen || !battleId) return;
    
    const fetchInvited = async () => {
      const { data } = await supabase
        .from('battle_invites')
        .select('recipient_id')
        .eq('battle_id', battleId);
      
      if (data) {
        setInvitedUsers(new Set(data.map(i => i.recipient_id)));
        setInviteCount(data.length);
      }
    };
    
    fetchInvited();
  }, [isOpen, battleId]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, league')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', profile?.id || '')
        .limit(20);
      
      setSearchResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, profile?.id]);

  const toggleUser = (userId: string) => {
    if (invitedUsers.has(userId)) return;
    
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      if (inviteCount + newSelected.size >= MAX_INVITES) {
        toast.error(`Max ${MAX_INVITES} invites per battle`);
        return;
      }
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const sendInvites = async () => {
    if (selectedUsers.size === 0 || !profile) return;
    
    setSending(true);
    
    const invites = Array.from(selectedUsers).map(recipientId => ({
      battle_id: battleId,
      sender_id: profile.id,
      recipient_id: recipientId,
      sender_username: profile.username,
      sender_avatar_url: profile.avatar_url,
    }));

    const { error } = await supabase
      .from('battle_invites')
      .insert(invites);

    setSending(false);

    if (error) {
      console.error('Error sending invites:', error);
      toast.error("Failed to send some invites");
    } else {
      toast.success(`Sent ${selectedUsers.size} battle invite${selectedUsers.size > 1 ? 's' : ''}!`);
      setInvitedUsers(prev => new Set([...prev, ...selectedUsers]));
      setInviteCount(prev => prev + selectedUsers.size);
      setSelectedUsers(new Set());
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  if (!isOpen) return null;

  const remainingInvites = MAX_INVITES - inviteCount - selectedUsers.size;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-background border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ 
            maxHeight: "85vh",
            marginBottom: "calc(56px + env(safe-area-inset-bottom, 0px))"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-red-400" />
              <span className="font-display text-lg text-foreground">Send 1v1 Invites</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-1 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 bg-surface-1 border-b border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {inviteCount} sent · {remainingInvites} remaining
            </span>
            {selectedUsers.size > 0 && (
              <span className="text-xs text-red-400 font-medium">
                {selectedUsers.size} selected
              </span>
            )}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search editors to challenge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-surface-1 border-border"
              />
            </div>
          </div>

          {/* Results */}
          <div 
            className="overflow-y-auto overscroll-contain" 
            style={{ maxHeight: "45vh", WebkitOverflowScrolling: "touch" }}
          >
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-border">
                {searchResults.map((user) => {
                  const isInvited = invitedUsers.has(user.id);
                  const isSelected = selectedUsers.has(user.id);
                  
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      disabled={isInvited}
                      className={`w-full flex items-center gap-3 p-4 transition-colors ${
                        isInvited 
                          ? 'opacity-50 cursor-not-allowed bg-surface-1' 
                          : isSelected
                          ? 'bg-red-500/10'
                          : 'hover:bg-surface-1'
                      }`}
                    >
                      <Avatar className={`w-10 h-10 border-2 ${
                        isSelected ? 'border-red-500' : 'border-transparent'
                      }`}>
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-red-500/20 text-red-400">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <span className="text-sm text-foreground font-medium">{user.username}</span>
                        <span className="text-[10px] text-muted-foreground block uppercase">
                          {user.league || 'Open'} League
                        </span>
                      </div>
                      {isInvited ? (
                        <span className="text-[10px] text-muted-foreground uppercase">Invited</span>
                      ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-border" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No editors found
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Search for editors to challenge
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  They'll get a notification to 1v1 you
                </p>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="p-4 border-t border-border bg-surface-1">
            <Button
              onClick={sendInvites}
              disabled={selectedUsers.size === 0 || sending}
              className="w-full h-12 bg-gradient-to-r from-red-500 via-red-400 to-red-500 hover:shadow-lg hover:shadow-red-500/30 text-white font-display uppercase tracking-wider"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}Challenge{selectedUsers.size !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
