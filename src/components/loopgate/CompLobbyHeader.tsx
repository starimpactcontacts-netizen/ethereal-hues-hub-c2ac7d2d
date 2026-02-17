import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Clock, Flame, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Participant {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface CompLobbyHeaderProps {
  /** Table to fetch participants from */
  participantTable: 'featured_submissions' | 'hosted_competition_participants' | 'event_participations';
  /** Column name for the competition/event id filter */
  filterColumn: string;
  /** The competition/event id value */
  filterId: string;
  /** Deadline / end time */
  deadline?: string | null;
  /** Total view/submission count override */
  totalEntries?: number;
  /** Accent color class */
  accentColor?: string;
}

export default function CompLobbyHeader({
  participantTable,
  filterColumn,
  filterId,
  deadline,
  totalEntries,
  accentColor = 'text-brand',
}: CompLobbyHeaderProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!filterId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from(participantTable as any)
        .select('user_id, username, avatar_url')
        .eq(filterColumn, filterId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        // Dedupe by user_id
        const seen = new Set<string>();
        const unique = (data as any[]).filter(p => {
          if (seen.has(p.user_id)) return false;
          seen.add(p.user_id);
          return true;
        });
        setParticipants(unique);
      }
    };

    fetch();

    // Realtime updates
    const channel = supabase
      .channel(`lobby-${filterId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: participantTable,
        filter: `${filterColumn}=eq.${filterId}`
      }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filterId, participantTable, filterColumn]);

  const deadlineDate = deadline ? new Date(deadline) : null;
  const isExpired = deadlineDate ? deadlineDate < new Date() : false;
  const showCount = participants.length;
  const extraCount = Math.max(0, (totalEntries || showCount) - 8);

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Participant Avatars */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex -space-x-2">
          {participants.slice(0, 8).map((p, i) => (
            <motion.div
              key={p.user_id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Avatar className="w-7 h-7 border-2 border-background ring-1 ring-border">
                <AvatarImage src={p.avatar_url || ''} />
                <AvatarFallback className="bg-surface-2 text-[8px] font-bold text-foreground">
                  {p.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          ))}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-surface-2 border-2 border-background ring-1 ring-border flex items-center justify-center">
              <span className="text-[8px] font-bold text-muted-foreground">+{extraCount}</span>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          <Users className="w-3 h-3 inline mr-0.5" />
          {totalEntries || showCount} in lobby
        </span>
      </div>

      {/* Timer */}
      {deadlineDate && !isExpired && (
        <div className="flex items-center gap-1.5 bg-surface-1 border border-border px-2.5 py-1 rounded-full shrink-0">
          <Clock className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-bold text-foreground tabular-nums">
            {formatDistanceToNow(deadlineDate, { addSuffix: false })}
          </span>
          <span className="text-[8px] text-muted-foreground">left</span>
        </div>
      )}
      {isExpired && (
        <div className="flex items-center gap-1 bg-muted/30 border border-border px-2.5 py-1 rounded-full shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground">Closed</span>
        </div>
      )}
    </div>
  );
}
