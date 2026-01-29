import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Participant {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: string;
}

interface HostedCompJoinButtonProps {
  competitionId: string;
  status: string;
  deadlinePassed: boolean;
  onJoin?: () => void;
}

export default function HostedCompJoinButton({ 
  competitionId, 
  status, 
  deadlinePassed,
  onJoin 
}: HostedCompJoinButtonProps) {
  const { user, profile } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!competitionId) return;

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('hosted_competition_participants' as any)
        .select('*')
        .eq('competition_id', competitionId)
        .order('joined_at', { ascending: false });

      const typedData = (data as unknown as Participant[]) || [];
      setParticipants(typedData);
      setIsJoined(typedData.some(p => p.user_id === user?.id));
      setIsLoading(false);
    };

    fetchParticipants();

    // Realtime subscription
    const channel = supabase
      .channel(`hosted-comp-participants-${competitionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'hosted_competition_participants',
        filter: `competition_id=eq.${competitionId}`
      }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, user?.id]);

  const handleJoin = async () => {
    if (!user || !profile) {
      toast.error("Sign in to join");
      return;
    }

    setIsJoining(true);
    const { error } = await supabase
      .from('hosted_competition_participants' as any)
      .insert({
        competition_id: competitionId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url
      });

    if (error) {
      toast.error(error.message || "Failed to join");
    } else {
      setIsJoined(true);
      toast.success("You've joined the competition!");
      onJoin?.();
    }
    setIsJoining(false);
  };

  const handleLeave = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('hosted_competition_participants' as any)
      .delete()
      .eq('competition_id', competitionId)
      .eq('user_id', user.id);

    if (!error) {
      setIsJoined(false);
      toast.success("Left the competition");
    }
  };

  const canJoin = status === 'live' && !deadlinePassed;

  if (isLoading) {
    return (
      <div className="bg-surface-1 border border-border rounded-lg p-4 animate-pulse">
        <div className="h-12 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Join/Status Button */}
      {canJoin && !isJoined && user && (
        <motion.button
          onClick={handleJoin}
          disabled={isJoining}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-background font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isJoining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Join Competition
            </>
          )}
        </motion.button>
      )}

      {isJoined && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">You've joined!</span>
            </div>
            {canJoin && (
              <button
                onClick={handleLeave}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Leave
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Now prepare your edit and submit before the deadline!
          </p>
        </div>
      )}

      {/* Participant Count & Avatars */}
      <div className="bg-surface-1 border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-lg font-bold">{participants.length}</span>
            <span className="text-sm text-muted-foreground">
              {participants.length === 1 ? 'editor' : 'editors'} joined
            </span>
          </div>
        </div>

        {/* Avatar Stack */}
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {participants.slice(0, 20).map((p, idx) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background overflow-hidden"
                style={{ zIndex: participants.length - idx }}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground bg-gradient-to-br from-cyan-500/20 to-sky-500/20">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {participants.length > 20 && (
              <div className="w-8 h-8 rounded-full bg-surface-2 border-2 border-background flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">+{participants.length - 20}</span>
              </div>
            )}
          </div>
        )}

        {participants.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Be the first to join this competition!
          </p>
        )}

        {/* Status Message */}
        {canJoin && participants.length > 0 && (
          <p className="text-[11px] text-cyan-400 mt-3">
            🔥 Editors are preparing entries...
          </p>
        )}
      </div>
    </div>
  );
}
