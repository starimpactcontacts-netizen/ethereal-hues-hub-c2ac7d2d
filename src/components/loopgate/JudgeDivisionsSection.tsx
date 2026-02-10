import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Shield, Crown, Star, Zap, Award, Circle, Lock } from 'lucide-react';
import { AuthorityGavel, NexusStar } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

interface Division {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  member_count: number;
  max_members: number | null;
  avatar_url: string | null;
  join_type: string;
  owner_id: string;
}

const emblemIcons: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  crown: <Crown className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
};

function DivisionCard({ division, index }: { division: Division; index: number }) {
  const navigate = useNavigate();
  const onlineCount = Math.max(1, Math.floor(division.member_count * 0.3));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/units/${division.id}`)}
      className="group cursor-pointer border border-zinc-800 hover:border-red-900/50 transition-all bg-black"
    >
      {/* Red accent top */}
      <div className="h-[2px] bg-gradient-to-r from-red-700 via-red-800 to-transparent" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 flex items-center justify-center border border-zinc-800 bg-zinc-950 shrink-0">
            {division.avatar_url ? (
              <img src={division.avatar_url} alt={division.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-red-500/70">
                {emblemIcons[division.emblem] || <AuthorityGavel size={18} />}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm tracking-wider text-white truncate group-hover:text-red-400 transition-colors">
              {division.name.toUpperCase()}
            </h3>
            <p className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5">
              {division.description || 'Official Judge Division'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-zinc-500">
              <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
              <span className="text-zinc-300">{onlineCount}</span> active
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Users className="w-3 h-3" />
              <span className="text-zinc-300">{division.member_count}</span>
              {division.max_members ? `/${division.max_members}` : ''}
            </span>
          </div>
          {division.join_type === 'invite_only' && (
            <Lock className="w-3 h-3 text-zinc-600" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function JudgeDivisionsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isJudge, isTrialJudge, isDev } = useUserRoles(user?.id);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = isJudge || isDev;

  useEffect(() => {
    fetchDivisions();
  }, []);

  async function fetchDivisions() {
    const { data, error } = await supabase
      .from('crews')
      .select('id, name, description, emblem, member_count, max_members, avatar_url, join_type, owner_id')
      .eq('is_judge_division', true)
      .order('member_count', { ascending: false });

    if (!error && data) {
      setDivisions(data);
    }
    setLoading(false);
  }

  return (
    <div className="border-t border-zinc-800">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-700" />
            <h2 className="font-display text-sm tracking-[0.15em] text-white">JUDGE DIVISIONS</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono">
              {divisions.length} ACTIVE
            </span>
            {canCreate && (
              <button
                onClick={() => navigate('/judges/divisions/create')}
                className="p-1.5 border border-zinc-700 hover:border-red-700 hover:bg-red-950/30 transition-colors"
              >
                <Plus size={12} className="text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-zinc-600 mb-3 font-mono uppercase tracking-wider">
          Elite departments · Review units · Specialized factions
        </p>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : divisions.length === 0 ? (
          <div className="border border-zinc-800 border-dashed p-6 text-center">
            <div className="w-12 h-12 mx-auto border border-zinc-800 flex items-center justify-center mb-3">
              <NexusStar className="text-zinc-600" size={20} />
            </div>
            <p className="font-display text-xs tracking-wider text-zinc-400 mb-1">NO DIVISIONS YET</p>
            <p className="text-[10px] text-zinc-600 mb-3">
              The Bureau is recruiting. Be the first to establish a division.
            </p>
            {canCreate && (
              <button
                onClick={() => navigate('/judges/divisions/create')}
                className="px-4 py-2 bg-red-700 text-white text-[10px] font-display uppercase tracking-wider hover:bg-red-600 transition-colors"
              >
                Establish Division
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {divisions.map((div, i) => (
              <DivisionCard key={div.id} division={div} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
