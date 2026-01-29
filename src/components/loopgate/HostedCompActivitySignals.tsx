import { useEffect } from "react";
import { Eye, Users, Clock, Flame, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, differenceInHours } from "date-fns";

interface HostedCompActivitySignalsProps {
  competitionId: string;
  viewCount: number;
  participantCount: number;
  submissionCount: number;
  deadline: string;
  isTrending?: boolean;
  communityUrl?: string | null;
}

export default function HostedCompActivitySignals({
  competitionId,
  viewCount,
  participantCount,
  submissionCount,
  deadline,
  isTrending = false,
  communityUrl
}: HostedCompActivitySignalsProps) {
  const hoursLeft = differenceInHours(new Date(deadline), new Date());
  const isUrgent = hoursLeft > 0 && hoursLeft <= 24;

  // Increment view count on mount
  useEffect(() => {
    if (!competitionId) return;
    
    // Call the increment function - fire and forget
    const incrementViews = async () => {
      try {
        await supabase.rpc('increment_hosted_comp_views', { comp_id: competitionId } as any);
      } catch {
        // Ignore errors
      }
    };
    incrementViews();
  }, [competitionId]);

  return (
    <div className="space-y-2">
      {/* Trending Badge */}
      {(isTrending || participantCount >= 10) && (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">
            🔥 Hot Competition — Trending Now
          </span>
        </div>
      )}

      {/* Activity Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Views */}
        <div className="bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-bold">{viewCount + 1}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Views</p>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-sm font-bold">{participantCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Joined</p>
          </div>
        </div>

        {/* Submissions */}
        <div className="bg-surface-1 border border-border rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-sm font-bold">{submissionCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Entries</p>
          </div>
        </div>

        {/* Deadline */}
        <div className={`bg-surface-1 border rounded-lg p-3 flex items-center gap-2 ${
          isUrgent ? 'border-amber-500/50' : 'border-border'
        }`}>
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-amber-400' : 'text-muted-foreground'}`} />
          <div>
            <p className={`text-sm font-bold ${isUrgent ? 'text-amber-400' : ''}`}>
              {hoursLeft > 0 ? `${hoursLeft}h` : 'Closed'}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase">
              {isUrgent ? '⏰ Last Chance!' : 'Remaining'}
            </p>
          </div>
        </div>
      </div>

      {/* Community Link */}
      {communityUrl && (
        <a
          href={communityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 hover:bg-indigo-500/20 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-400">Join Host Community</p>
                <p className="text-[10px] text-muted-foreground">Get updates & connect with other editors</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>
      )}
    </div>
  );
}
