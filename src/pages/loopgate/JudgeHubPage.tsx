import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Trophy, Flame, Star, Crown, Zap, Users, 
  TrendingUp, Award, ChevronRight, Sparkles, Target,
  ArrowLeft, Send, ExternalLink, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LevelBadge from '@/components/loopgate/LevelBadge';
import VerifiedBadge from '@/components/loopgate/VerifiedBadge';
import BottomNav from '@/components/loopgate/BottomNav';
import RequestJudgeReviewModal from '@/components/loopgate/RequestJudgeReviewModal';
import JudgeBadge, { JUDGE_BADGES } from '@/components/loopgate/JudgeBadge';

interface JudgeProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  verification_status: boolean;
  judge_badge: string | null;
  totalReviews: number;
  avgScore: number;
  thisWeek: number;
  vibe?: string;
}

// Judge vibes/tags
const JUDGE_VIBES = [
  'Blunt Judge',
  'Technical Judge',
  'Energetic Judge',
  'Supportive Coach',
  'Detail-Oriented',
  'Creative Eye',
  'Trend Spotter',
  'Story Master',
];

// Niche filters
const NICHES = [
  { id: 'all', label: 'All' },
  { id: 'anime', label: 'Anime' },
  { id: 'velocity', label: 'Velocity' },
  { id: 'meme', label: 'Meme' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'amv', label: 'AMV' },
  { id: 'film', label: 'Film' },
];

// Featured section types
type FeaturedSection = 'trending' | 'top_xp' | 'active' | 'elite';

function JudgeCard({ judge, onSelect }: { judge: JudgeProfile; onSelect: (judge: JudgeProfile) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(judge)}
      className="w-full bg-card border border-border hover:border-gold/50 rounded-xl p-4 text-left transition-all group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {judge.avatar_url ? (
            <img 
              src={judge.avatar_url} 
              alt={judge.username}
              className="w-14 h-14 rounded-full object-cover border-2 border-gold/30 group-hover:border-gold transition-colors"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/30">
              <span className="text-xl font-bold text-gold">
                {(judge.display_name || judge.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1">
            <LevelBadge level={judge.level} size="sm" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-display text-sm truncate">
              {judge.display_name || judge.username}
            </span>
            {judge.verification_status && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-xs text-muted-foreground mb-2">@{judge.username}</p>
          
          {/* Badge */}
          {judge.judge_badge && JUDGE_BADGES[judge.judge_badge] ? (
            <JudgeBadge badge={JUDGE_BADGES[judge.judge_badge]} size="sm" showTooltip={false} animate={false} />
          ) : judge.vibe ? (
            <Badge variant="outline" className="text-[10px] mb-2 border-gold/30 text-gold">
              {judge.vibe}
            </Badge>
          ) : null}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy size={10} className="text-gold" />
              <span>{judge.totalReviews} reviews</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star size={10} className="text-gold" />
              <span>Avg {judge.avgScore.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Flame size={10} className="text-orange-400" />
              <span>{judge.thisWeek} this week</span>
            </div>
          </div>
        </div>

        <ChevronRight size={18} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}

function JudgePreviewModal({ 
  judge, 
  onClose, 
  onSubmit 
}: { 
  judge: JudgeProfile; 
  onClose: () => void;
  onSubmit: (judgeId: string) => void;
}) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl overflow-hidden pb-6"
      >
        {/* Header with avatar */}
        <div className="relative h-24 bg-gradient-to-b from-gold/20 to-transparent">
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            {judge.avatar_url ? (
              <img 
                src={judge.avatar_url} 
                alt={judge.username}
                className="w-20 h-20 rounded-full object-cover border-4 border-card"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center border-4 border-card">
                <span className="text-2xl font-bold text-gold">
                  {(judge.display_name || judge.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="font-display text-xl">{judge.display_name || judge.username}</h3>
            {judge.verification_status && <VerifiedBadge />}
          </div>
          <p className="text-sm text-muted-foreground mb-2">@{judge.username}</p>
          
          {/* Level + XP */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <LevelBadge level={judge.level} size="sm" />
            <span className="text-xs text-muted-foreground">{judge.xp.toLocaleString()} XP</span>
          </div>

          {/* Vibe */}
          {judge.vibe && (
            <Badge className="mb-4 bg-gold/10 text-gold border-gold/30">
              {judge.vibe}
            </Badge>
          )}

          {/* Bio */}
          {judge.bio && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{judge.bio}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-surface-1 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-gold">{judge.totalReviews}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Total Reviews</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-foreground">{judge.avgScore.toFixed(0)}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Avg Score</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-lg p-3">
              <div className="text-xl font-bold text-orange-400">{judge.thisWeek}</div>
              <div className="text-[10px] text-muted-foreground uppercase">This Week</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/judge/${judge.username}`)}
              className="flex-1 py-3 bg-surface-1 border border-border rounded-lg text-sm font-medium hover:bg-surface-2 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              View Profile
            </button>
            <button
              onClick={() => onSubmit(judge.id)}
              className="flex-1 py-3 bg-gold text-black rounded-lg text-sm font-bold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
            >
              <Send size={14} />
              Submit Edit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JudgeHubPage() {
  const { user, profile } = useAuth();
  const { isJudge, isDev } = useUserRoles(user?.id);
  const navigate = useNavigate();
  
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [featuredSection, setFeaturedSection] = useState<FeaturedSection>('trending');
  
  const [selectedJudge, setSelectedJudge] = useState<JudgeProfile | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [targetJudgeId, setTargetJudgeId] = useState<string | null>(null);

  useEffect(() => {
    fetchJudges();
  }, []);

  async function fetchJudges() {
    setLoading(true);
    try {
      // Get all users with judge role
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (!judgeRoles?.length) {
        setLoading(false);
        return;
      }

      const judgeIds = judgeRoles.map(r => r.user_id);

      // Get judge profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, level, xp, verification_status, judge_badge')
        .in('id', judgeIds);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get review stats for each judge
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id, total_score, reviewed_at')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      // Build judge profiles with stats
      const judgesWithStats: JudgeProfile[] = profiles.map(profile => {
        const judgeReviews = (reviews || []).filter(r => r.judge_id === profile.id);
        const weeklyReviews = judgeReviews.filter(r => 
          r.reviewed_at && new Date(r.reviewed_at) >= oneWeekAgo
        );
        const avgScore = judgeReviews.length > 0
          ? judgeReviews.reduce((acc, r) => acc + (r.total_score || 0), 0) / judgeReviews.length
          : 0;

        return {
          ...profile,
          totalReviews: judgeReviews.length,
          avgScore,
          thisWeek: weeklyReviews.length,
        };
      });

      setJudges(judgesWithStats);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort judges
  const filteredJudges = judges
    .filter(j => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return j.username.toLowerCase().includes(query) || 
             (j.display_name?.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      switch (featuredSection) {
        case 'trending':
        case 'active':
          return b.thisWeek - a.thisWeek;
        case 'top_xp':
          return b.xp - a.xp;
        case 'elite':
          return b.totalReviews - a.totalReviews;
        default:
          return b.totalReviews - a.totalReviews;
      }
    });

  // Get featured judges for hero section
  const featuredJudges = [...judges]
    .sort((a, b) => b.totalReviews - a.totalReviews)
    .slice(0, 3);

  const handleJudgeSelect = (judge: JudgeProfile) => {
    setSelectedJudge(judge);
  };

  const handleSubmitToJudge = (judgeId: string) => {
    setTargetJudgeId(judgeId);
    setSelectedJudge(null);
    setShowSubmitModal(true);
  };

  const handleQuickSubmit = () => {
    setTargetJudgeId(null);
    setShowSubmitModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/10 blur-[100px] rounded-full" />

        <div className="relative pt-6 pb-4 px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface-1 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            {(isJudge || isDev) && (
              <Link
                to="/ops-panel/a7c92ff31b"
                className="px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-lg text-xs font-medium text-gold hover:bg-gold/20 transition-colors flex items-center gap-1.5"
              >
                <Target size={12} />
                Judge Panel
              </Link>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <h1 className="font-display text-2xl tracking-wide">QOI JUDGES</h1>
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <p className="text-sm text-muted-foreground">
              Get your edits rated by elite judges
            </p>
          </div>

          {/* Quick Submit CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuickSubmit}
            className="w-full py-4 bg-gradient-to-r from-gold via-gold to-amber-500 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gold/20 mb-6"
          >
            <Send size={16} />
            Request Judge Review
          </motion.button>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search judges by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-surface-1 border-border"
            />
          </div>

          {/* Featured section tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {[
              { id: 'trending' as const, label: 'Trending', icon: Flame },
              { id: 'top_xp' as const, label: 'Top XP', icon: Crown },
              { id: 'active' as const, label: 'Most Active', icon: Zap },
              { id: 'elite' as const, label: 'Elite', icon: Award },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setFeaturedSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  featuredSection === section.id
                    ? 'bg-gold text-black'
                    : 'bg-surface-1 border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <section.icon size={12} />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Judges List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gold" />
            </div>
            <p className="font-display text-lg mb-1">NO JUDGES FOUND</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search' : 'Judges coming soon'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {filteredJudges.length} Judge{filteredJudges.length !== 1 ? 's' : ''}
              </p>
              <Link 
                to="/judges/leaderboard"
                className="text-xs text-gold hover:underline flex items-center gap-1"
              >
                View Leaderboard
                <ChevronRight size={12} />
              </Link>
            </div>
            
            {filteredJudges.map((judge, index) => (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <JudgeCard judge={judge} onSelect={handleJudgeSelect} />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Judge Preview Modal */}
      <AnimatePresence>
        {selectedJudge && (
          <JudgePreviewModal
            judge={selectedJudge}
            onClose={() => setSelectedJudge(null)}
            onSubmit={handleSubmitToJudge}
          />
        )}
      </AnimatePresence>

      {/* Submit Review Modal */}
      <RequestJudgeReviewModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setTargetJudgeId(null);
        }}
        preselectedJudgeId={targetJudgeId}
      />

      <BottomNav />
    </div>
  );
}
