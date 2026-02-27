import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Globe, Plus, Users, Trophy, 
  ChevronRight, Clock, Loader2, ArrowLeft, Crown 
} from "lucide-react";
import { useHostedCompetitions, HostedCompetition } from "@/hooks/useHostedCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { useGuestMode } from "@/hooks/useGuestMode";
import ProposeHostedCompModal from "@/components/loopgate/ProposeHostedCompModal";
import { formatDistanceToNow, isPast } from "date-fns";

function CompetitionCard({ comp, onClick }: { comp: HostedCompetition; onClick: () => void }) {
  const deadlinePassed = isPast(new Date(comp.submission_deadline));
  const isLive = comp.status === 'live' && !deadlinePassed;
  const isJudging = comp.status === 'judging' || (comp.status === 'live' && deadlinePassed);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-surface-1 border border-border hover:border-gold/40 transition-all text-left overflow-hidden group"
    >
      {/* Poster */}
      <div className="h-32 bg-gradient-to-br from-gold/10 via-surface-2 to-transparent relative">
        {comp.poster_url && (
          <img src={comp.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/60 to-transparent" />
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {comp.status === 'completed' && (
            <span className="px-2.5 py-1 bg-muted/80 backdrop-blur-sm text-muted-foreground text-[9px] font-bold uppercase tracking-wider rounded-sm">Completed</span>
          )}
          {isJudging && (
            <span className="px-2.5 py-1 bg-amber-500/20 backdrop-blur-sm text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded-sm animate-pulse">Judging</span>
          )}
          {isLive && (
            <span className="px-2.5 py-1 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-4 -mt-8 relative space-y-2">
        {/* Host */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center overflow-hidden shadow-md">
            {comp.host_avatar_url ? (
              <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Crown className="w-4 h-4 text-gold" />
            )}
          </div>
          <span className="text-[11px] text-gold font-semibold tracking-wide">{comp.host_name}</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg text-foreground leading-tight line-clamp-1">{comp.name}</h3>
        
        {/* Description */}
        {comp.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{comp.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{comp.submission_count || 0} entries</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {deadlinePassed ? (
              <span className="text-amber-400">Closed</span>
            ) : (
              <span>{formatDistanceToNow(new Date(comp.submission_deadline), { addSuffix: true })}</span>
            )}
          </div>
          {comp.prize_description && (
            <div className="flex items-center gap-1 text-gold">
              <Trophy className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{comp.prize_description}</span>
            </div>
          )}
        </div>

        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.button>
  );
}

export default function HostedCompsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const { competitions, loading } = useHostedCompetitions();
  const [showProposeModal, setShowProposeModal] = useState(false);

  const liveComps = competitions.filter(c => c.status === 'live');
  const judgingComps = competitions.filter(c => c.status === 'judging');
  const completedComps = competitions.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/arena')} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              Hosted Comps
            </h1>
            <p className="text-[10px] text-muted-foreground">Community-run competitions on Loopgate infrastructure</p>
          </div>
          <button
            onClick={() => {
              if (isGuest) { navigate('/auth'); return; }
              setShowProposeModal(true);
            }}
            className="bg-gold text-background text-[10px] font-bold px-3 py-1.5 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Host
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-20">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
          </div>
        )}

        {/* Live */}
        {liveComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Now
            </h2>
            <div className="space-y-3">
              {liveComps.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Judging */}
        {judgingComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Judging in Progress
            </h2>
            <div className="space-y-3">
              {judgingComps.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completed</h2>
            <div className="space-y-3">
              {completedComps.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} onClick={() => navigate(`/hosted-comp/${comp.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading && competitions.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Globe className="w-12 h-12 text-gold/20 mx-auto" />
            <p className="text-sm text-muted-foreground">No hosted competitions yet</p>
            <p className="text-[11px] text-muted-foreground/60">Be the first to host one</p>
          </div>
        )}
      </div>

      <ProposeHostedCompModal isOpen={showProposeModal} onClose={() => setShowProposeModal(false)} />
    </div>
  );
}
