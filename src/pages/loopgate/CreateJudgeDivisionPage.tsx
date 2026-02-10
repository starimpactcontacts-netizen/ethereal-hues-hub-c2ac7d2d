import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Crown, Users, Star, Zap, Award } from 'lucide-react';
import { AuthorityGavel } from '@/components/loopgate/LoopgateIcons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const emblems = [
  { id: 'shield', icon: Shield, label: 'Shield' },
  { id: 'crown', icon: Crown, label: 'Crown' },
  { id: 'users', icon: Users, label: 'Team' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'zap', icon: Zap, label: 'Lightning' },
  { id: 'award', icon: Award, label: 'Award' },
];

const joinTypes = [
  { id: 'open', label: 'Open Enrollment', description: 'Any judge can join' },
  { id: 'invite_only', label: 'Classified', description: 'Requires approval from division lead' },
];

export default function CreateJudgeDivisionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isJudge, isDev } = useUserRoles(user?.id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emblem: 'shield',
    join_type: 'invite_only',
    max_members: '',
  });

  useEffect(() => {
    if (!user) navigate('/judges');
  }, [user, navigate]);

  // Only judges/devs can create
  if (!isJudge && !isDev) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <AuthorityGavel size={32} className="text-zinc-600 mx-auto mb-3" />
          <p className="font-display text-sm text-zinc-400 tracking-wider">CLEARANCE REQUIRED</p>
          <p className="text-[10px] text-zinc-600 mt-1">Only active Judges may establish divisions.</p>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!user || !formData.name.trim()) return;
    setLoading(true);

    try {
      // Create division (a crew with is_judge_division = true)
      const { data: division, error: crewError } = await supabase
        .from('crews')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          emblem: formData.emblem,
          min_league: 'open' as const,
          join_type: formData.join_type,
          owner_id: user.id,
          member_count: 1,
          max_members: formData.max_members ? parseInt(formData.max_members) : null,
          is_judge_division: true,
        })
        .select()
        .single();

      if (crewError) {
        if (crewError.code === '23505') {
          toast.error('A division with this name already exists.');
        } else {
          toast.error('Failed to establish division.');
          console.error(crewError);
        }
        setLoading(false);
        return;
      }

      // Add creator as owner
      await supabase.from('crew_members').insert({
        crew_id: division.id,
        user_id: user.id,
        role: 'owner',
        is_primary: false, // Judge divisions are never primary units
      });

      // Seed default channels
      await supabase.from('crew_channels').insert([
        { crew_id: division.id, name: 'general', channel_type: 'text', category: 'Division HQ', category_order: 0, channel_order: 0 },
        { crew_id: division.id, name: 'briefings', channel_type: 'text', category: 'Division HQ', category_order: 0, channel_order: 1 },
      ]);

      toast.success('Division established.');
      navigate(`/units/${division.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="h-[2px] bg-red-700" />
      <div className="px-4 pt-4 pb-5 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} className="text-zinc-400" />
          </button>
          <h1 className="font-display text-lg tracking-wider text-white">ESTABLISH DIVISION</h1>
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-mono">
          Bureau of Authority · New Division Filing
        </p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Division Designation</label>
          <Input
            placeholder="e.g. Verdict Council, Review Corps..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            maxLength={48}
            className="bg-black border-zinc-800 text-white placeholder:text-zinc-700 focus:border-red-800"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Mission Brief</label>
          <Textarea
            placeholder="Describe the division's purpose and mandate..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={200}
            rows={3}
            className="bg-black border-zinc-800 text-white placeholder:text-zinc-700 focus:border-red-800 resize-none"
          />
        </div>

        {/* Emblem */}
        <div className="space-y-3">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Division Insignia</label>
          <div className="grid grid-cols-6 gap-2">
            {emblems.map((emblem) => (
              <button
                key={emblem.id}
                onClick={() => setFormData({ ...formData, emblem: emblem.id })}
                className={`aspect-square flex items-center justify-center transition-all ${
                  formData.emblem === emblem.id
                    ? 'bg-red-950 border-2 border-red-700 text-red-400'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <emblem.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Access Level */}
        <div className="space-y-3">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Access Classification</label>
          <div className="space-y-2">
            {joinTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFormData({ ...formData, join_type: type.id })}
                className={`w-full p-3 text-left transition-all ${
                  formData.join_type === type.id
                    ? 'bg-red-950/50 border border-red-800'
                    : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <p className="font-display text-xs tracking-wider text-white">{type.label.toUpperCase()}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Max Members */}
        <div className="space-y-2">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Personnel Cap (optional)</label>
          <Input
            type="number"
            placeholder="e.g. 25"
            value={formData.max_members}
            onChange={(e) => setFormData({ ...formData, max_members: e.target.value })}
            min={1}
            max={500}
            className="bg-black border-zinc-800 text-white placeholder:text-zinc-700 focus:border-red-800"
          />
          <p className="text-[9px] text-zinc-600 font-mono">
            {formData.max_members ? `Limit: ${formData.max_members} personnel` : 'No limit'}
          </p>
        </div>

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={loading || !formData.name.trim()}
          className="w-full py-3.5 bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-display text-sm uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2"
        >
          <AuthorityGavel size={14} />
          {loading ? 'Filing...' : 'Establish Division'}
        </button>
      </div>
    </div>
  );
}
