import { Link } from "react-router-dom";
import { ExternalLink, Clock, CheckCircle, AlertCircle, Trophy } from "lucide-react";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  scored: {
    label: "Scored",
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

const platformColors: Record<string, string> = {
  tiktok: "bg-pink-500/20 text-pink-400",
  instagram: "bg-purple-500/20 text-purple-400",
  youtube: "bg-red-500/20 text-red-400",
};

export default function MySubmissions() {
  const { submissions, loading } = useUserSubmissions();

  if (loading) {
    return (
      <div className="bg-surface-1 border border-border p-4">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-surface-1 border border-border p-6 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No submissions yet</p>
        <Link 
          to="/events" 
          className="text-xs text-gold hover:underline uppercase tracking-wider"
        >
          Browse Events →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => {
        const status = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = status.icon;
        
        return (
          <div 
            key={submission.id} 
            className="bg-surface-1 border border-border p-4 space-y-3"
          >
            {/* Event Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/events/${submission.event_id}`}
                  className="font-semibold text-sm hover:text-gold transition-colors line-clamp-1"
                >
                  {submission.event?.title || 'Unknown Event'}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${platformColors[submission.platform] || 'bg-muted text-muted-foreground'}`}>
                    {submission.platform}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className={`flex items-center gap-1.5 px-2 py-1 ${status.bg}`}>
                <StatusIcon size={12} className={status.color} />
                <span className={`text-[10px] uppercase tracking-wider ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Submission Link */}
            <a 
              href={submission.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-gold transition-colors"
            >
              <ExternalLink size={12} />
              <span className="truncate">{submission.submission_url}</span>
            </a>

            {/* QOI Scores (if scored) */}
            {submission.status === 'scored' && submission.qoi_score && (
              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{submission.quality_score || '—'}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Quality</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{submission.originality_score || '—'}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Original</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{submission.impact_score || '—'}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Impact</p>
                  </div>
                  <div className="bg-gold/10 -m-1 p-1">
                    <p className="text-lg font-bold text-gold">{submission.qoi_score.toFixed(1)}</p>
                    <p className="text-[9px] text-gold uppercase tracking-wider">QOI</p>
                  </div>
                </div>

                {submission.final_rank && (
                  <div className="mt-3 pt-3 border-t border-border text-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Final Rank: </span>
                    <span className="text-gold font-bold">#{submission.final_rank}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
