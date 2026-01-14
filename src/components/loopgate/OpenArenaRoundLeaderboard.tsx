import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronUp, ChevronDown, ExternalLink, Crown, XCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface RoundParticipation {
  id: string;
  user_id: string;
  round_number: number;
  status: 'active' | 'advanced' | 'eliminated' | 'pending';
  qoi_score: number | null;
  cumulative_qoi: number | null;
  quality_score: number | null;
  originality_score: number | null;
  impact_score: number | null;
  submission_url: string | null;
  submitted_at: string | null;
  username?: string;
  avatar_url?: string | null;
}

interface EventRound {
  id: string;
  round_number: number;
  round_type: 'open' | 'elimination' | 'threshold';
  status: 'pending' | 'active' | 'completed';
  advancement_type: string;
  advancement_value: number | null;
  threshold_qoi: number | null;
  show_leaderboard: boolean;
}

interface Props {
  eventId: string;
  rounds: EventRound[];
  showEliminated: boolean;
  currentUserId?: string;
}

export default function OpenArenaRoundLeaderboard({ eventId, rounds, showEliminated, currentUserId }: Props) {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [participants, setParticipants] = useState<RoundParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  const activeRound = rounds.find(r => r.status === 'active') || rounds.find(r => r.status === 'completed');
  const displayRound = rounds.find(r => r.round_number === selectedRound);

  useEffect(() => {
    if (activeRound) {
      setSelectedRound(activeRound.round_number);
    }
  }, [activeRound]);

  useEffect(() => {
    fetchRoundParticipants();
  }, [eventId, selectedRound]);

  async function fetchRoundParticipants() {
    setLoading(true);
    const { data, error } = await supabase
      .from('round_participations')
      .select('*')
      .eq('event_id', eventId)
      .eq('round_number', selectedRound)
      .order('qoi_score', { ascending: false, nullsFirst: false });

    if (!error && data) {
      // Fetch usernames
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const participantsWithProfiles = data.map(p => ({
        ...p,
        username: profileMap.get(p.user_id)?.username || 'Unknown',
        avatar_url: profileMap.get(p.user_id)?.avatar_url || null,
      })) as RoundParticipation[];

      setParticipants(showEliminated 
        ? participantsWithProfiles 
        : participantsWithProfiles.filter(p => p.status !== 'eliminated')
      );
    }
    setLoading(false);
  }

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`round-${eventId}-${selectedRound}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'round_participations',
        filter: `event_id=eq.${eventId}`,
      }, () => {
        fetchRoundParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, selectedRound]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'advanced':
        return (
          <Badge className="bg-green-500/20 text-green-400 text-[9px] gap-1">
            <CheckCircle2 size={10} />
            Advanced
          </Badge>
        );
      case 'eliminated':
        return (
          <Badge className="bg-red-500/20 text-red-400 text-[9px] gap-1">
            <XCircle size={10} />
            Eliminated
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-muted text-muted-foreground text-[9px]">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gold/20 text-gold text-[9px]">
            Active
          </Badge>
        );
    }
  };

  const getRoundTypeLabel = (round: EventRound) => {
    if (round.round_type === 'elimination') {
      if (round.advancement_type === 'top_x') {
        return `Top ${round.advancement_value} advance`;
      } else if (round.advancement_type === 'percentage') {
        return `Top ${round.advancement_value}% advance`;
      }
      return 'Elimination';
    } else if (round.round_type === 'threshold') {
      return `QOI ≥ ${round.threshold_qoi} to advance`;
    }
    return 'Open Round';
  };

  if (!displayRound?.show_leaderboard && displayRound?.status !== 'completed') {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <Trophy size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Leaderboard hidden during this round
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Round Selector */}
      <div className="flex border-b border-border">
        {rounds.map((round) => (
          <button
            key={round.round_number}
            onClick={() => round.status !== 'pending' && setSelectedRound(round.round_number)}
            disabled={round.status === 'pending'}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              selectedRound === round.round_number
                ? 'bg-gold/10 text-gold border-b-2 border-gold'
                : round.status === 'pending'
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:bg-surface-1'
            }`}
          >
            <span className="block text-xs uppercase tracking-wider mb-0.5">Round {round.round_number}</span>
            <span className={`text-[10px] ${
              round.status === 'active' ? 'text-green-400' : 
              round.status === 'completed' ? 'text-muted-foreground' : 
              'text-muted-foreground/50'
            }`}>
              {round.status === 'active' ? '● Live' : round.status === 'completed' ? 'Complete' : 'Locked'}
            </span>
          </button>
        ))}
      </div>

      {/* Round Info */}
      {displayRound && (
        <div className="px-4 py-2 bg-surface-1/50 border-b border-border flex items-center justify-between">
          <Badge className={`text-[10px] ${
            displayRound.round_type === 'open' ? 'bg-green-500/20 text-green-400' :
            displayRound.round_type === 'elimination' ? 'bg-orange-500/20 text-orange-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {displayRound.round_type.toUpperCase()}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {getRoundTypeLabel(displayRound)}
          </span>
        </div>
      )}

      {/* Rankings Header */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Round {selectedRound} Rankings
        </span>
        {displayRound?.status === 'active' && (
          <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Updating
          </span>
        )}
      </div>

      {/* Rankings List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : participants.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No submissions yet for this round
          </div>
        ) : (
          <div className="divide-y divide-border">
            {participants.map((participant, index) => {
              const isCurrentUser = participant.user_id === currentUserId;
              const rank = index + 1;

              return (
                <div
                  key={participant.id}
                  className={`px-4 py-3 flex items-center gap-3 ${
                    isCurrentUser ? 'bg-gold/5' : ''
                  } ${participant.status === 'eliminated' ? 'opacity-60' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {rank <= 3 ? (
                      <Crown 
                        size={16} 
                        className={
                          rank === 1 ? 'text-gold' : 
                          rank === 2 ? 'text-gray-400' : 
                          'text-amber-700'
                        } 
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/u/${participant.username}`}
                        className="font-semibold text-sm hover:text-gold transition-colors truncate"
                      >
                        {participant.username}
                        {isCurrentUser && <span className="text-gold ml-1">(You)</span>}
                      </Link>
                      {getStatusBadge(participant.status)}
                    </div>
                    {participant.submission_url && (
                      <a
                        href={participant.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-gold flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink size={10} />
                        View submission
                      </a>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-3 text-xs">
                    {participant.qoi_score !== null ? (
                      <>
                        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                          <span>Q<span className="text-foreground ml-0.5">{participant.quality_score || '—'}</span></span>
                          <span>O<span className="text-foreground ml-0.5">{participant.originality_score || '—'}</span></span>
                          <span>I<span className="text-foreground ml-0.5">{participant.impact_score || '—'}</span></span>
                        </div>
                        <span className="font-bold text-gold w-12 text-right">
                          {participant.qoi_score.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Pending score</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
