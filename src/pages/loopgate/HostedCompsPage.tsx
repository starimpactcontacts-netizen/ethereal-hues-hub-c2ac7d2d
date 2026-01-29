import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Globe, Plus, Users, Trophy, 
  ChevronRight, Clock, Loader2, Sparkles, ArrowLeft 
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

  const getStatusBadge = () => {
    if (comp.status === 'completed') {
      return <span className="px-2 py-0.5 bg-zinc-500/20 text-zinc-400 text-[9px] font-bold uppercase tracking-wider rounded">Completed</span>;
    }
    if (isJudging) {
      return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded animate-pulse">Judging</span>;
    }
    if (isLive) {
      return <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded">Live</span>;
    }
    return null;
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full bg-surface-1 border border-border hover:border-cyan-500/50 transition-all text-left overflow-hidden group"
    >
      {/* Poster or gradient header */}
      <div className="h-20 bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent relative">
        {comp.poster_url && (
          <img src={comp.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-1 to-transparent" />
        <div className="absolute top-2 right-2">
          {getStatusBadge()}
        </div>
      </div>

      <div className="p-4 -mt-6 relative">
        {/* Host */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
            {comp.host_avatar_url ? (
              <img src={comp.host_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Globe className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <span className="text-xs text-cyan-400 font-medium">{comp.host_name}</span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base text-foreground mb-1 line-clamp-1">{comp.name}</h3>
        
        {/* Description */}
        {comp.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{comp.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
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
              <span className="truncate max-w-[80px]">{comp.prize_description}</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
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
      
      {/* Back Button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/arena')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Arena
        </button>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-sky-500 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
            <Globe className="w-8 h-8 text-background" />
          </div>
          <h1 className="font-display text-2xl tracking-wide">HOSTED COMPS</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Discord servers & creators run their competitions on Loopgate infrastructure
          </p>
        </div>

        {/* Propose Button */}
        <motion.button
          onClick={() => {
            if (isGuest) {
              navigate('/auth');
              return;
            }
            setShowProposeModal(true);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-sky-500 text-background font-bold rounded-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Host Your Own Competition
        </motion.button>

        {/* How it Works */}
        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            How It Works
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { step: '1', label: 'Propose' },
              { step: '2', label: 'Approved' },
              { step: '3', label: 'Editors Submit' },
              { step: '4', label: 'You Judge' }
            ].map((item) => (
              <div key={item.step} className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <span className="text-xs font-bold text-cyan-400">{item.step}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        )}

        {/* Live Competitions */}
        {liveComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Now
            </h2>
            <div className="space-y-3">
              {liveComps.map((comp) => (
                <CompetitionCard 
                  key={comp.id} 
                  comp={comp} 
                  onClick={() => navigate(`/hosted-comp/${comp.id}`)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Judging */}
        {judgingComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Judging in Progress
            </h2>
            <div className="space-y-3">
              {judgingComps.map((comp) => (
                <CompetitionCard 
                  key={comp.id} 
                  comp={comp} 
                  onClick={() => navigate(`/hosted-comp/${comp.id}`)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedComps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Completed
            </h2>
            <div className="space-y-3">
              {completedComps.map((comp) => (
                <CompetitionCard 
                  key={comp.id} 
                  comp={comp} 
                  onClick={() => navigate(`/hosted-comp/${comp.id}`)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && competitions.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-cyan-500/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No hosted competitions yet</p>
            <p className="text-xs text-muted-foreground/70">Be the first to host one!</p>
          </div>
        )}
      </div>

      {/* Propose Modal */}
      <ProposeHostedCompModal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
      />
    </div>
  );
}
