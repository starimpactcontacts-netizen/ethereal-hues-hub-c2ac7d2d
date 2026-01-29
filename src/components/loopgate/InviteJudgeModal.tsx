import { useState } from "react";
import { Gavel, Search, UserPlus, X, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteJudgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  competitionName: string;
  hostUserId: string;
  existingJudgeIds: string[];
  onInvited: () => void;
}

export default function InviteJudgeModal({
  open,
  onOpenChange,
  competitionId,
  competitionName,
  hostUserId,
  existingJudgeIds,
  onInvited
}: InviteJudgeModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error("Enter at least 2 characters");
      return;
    }

    setIsSearching(true);
    try {
      // Search for users who have judge role
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['judge', 'trial_judge']);

      const judgeUserIds = judgeRoles?.map(r => r.user_id) || [];

      // Search profiles of judges
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name')
        .ilike('username', `%${searchQuery}%`)
        .in('id', judgeUserIds)
        .limit(10);

      // Filter out already invited judges and host
      const filtered = (profiles || []).filter(
        p => !existingJudgeIds.includes(p.id) && p.id !== hostUserId
      );

      setSearchResults(filtered);
      if (filtered.length === 0) {
        toast("No eligible judges found", { description: "Try searching for a different username" });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (user: any) => {
    setInviting(user.id);
    try {
      const { error } = await supabase
        .from('hosted_competition_judges')
        .insert({
          competition_id: competitionId,
          user_id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          invited_by: hostUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Invited ${user.username}!`);
      setSearchResults(prev => prev.filter(p => p.id !== user.id));
      onInvited();
    } catch (error) {
      console.error('Invite error:', error);
      toast.error("Failed to invite judge");
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Gavel className="w-5 h-5 text-cyan-400" />
            Invite Judges
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for certified judges to help score submissions for "{competitionName}"
          </p>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search judge username..."
                className="w-full bg-surface-1 border border-border rounded-lg pl-9 pr-4 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-cyan-500 text-background font-semibold rounded-lg disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Results
              </h4>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 bg-surface-1 border border-border rounded-lg p-3"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-2 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.display_name || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleInvite(user)}
                    disabled={inviting === user.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-50"
                  >
                    {inviting === user.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          <div className="bg-surface-1 border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 Only certified judges can be invited. They'll receive a notification and can accept or decline.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
