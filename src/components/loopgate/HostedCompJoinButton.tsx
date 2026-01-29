import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";
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
      <div className="animate-pulse">
        <div className="h-12 bg-surface-2 rounded-lg" />
      </div>
    );
  }

  // If already joined, just show status
  if (isJoined) {
    return null; // Parent component handles this state
  }

  // Show join button
  return (
    <motion.button
      onClick={handleJoin}
      disabled={isJoining || !canJoin}
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
  );
}
