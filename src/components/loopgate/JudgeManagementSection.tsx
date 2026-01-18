import { useState, useEffect } from 'react';
import { Gavel, Search, Crown, Save, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import JudgeBadge, { JUDGE_BADGES, REVIEW_STYLES } from './JudgeBadge';

interface JudgeUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  judge_bio: string | null;
  judge_specialty: string | null;
  judge_badge: string | null;
  review_style: string | null;
  totalReviews: number;
}

export default function JudgeManagementSection() {
  const [judges, setJudges] = useState<JudgeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJudgeId, setExpandedJudgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Edit states
  const [editBio, setEditBio] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editBadge, setEditBadge] = useState<string | null>(null);
  const [editStyle, setEditStyle] = useState<string>('full_qoi');

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
        .select('id, username, display_name, avatar_url, level, judge_bio, judge_specialty, judge_badge, review_style')
        .in('id', judgeIds);

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get review counts
      const { data: reviews } = await supabase
        .from('review_requests')
        .select('judge_id')
        .eq('status', 'reviewed')
        .in('judge_id', judgeIds);

      const reviewCounts: Record<string, number> = {};
      (reviews || []).forEach(r => {
        reviewCounts[r.judge_id!] = (reviewCounts[r.judge_id!] || 0) + 1;
      });

      const judgesWithData: JudgeUser[] = profiles.map(p => ({
        ...p,
        totalReviews: reviewCounts[p.id] || 0,
      }));

      setJudges(judgesWithData.sort((a, b) => b.totalReviews - a.totalReviews));
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleExpandJudge = (judge: JudgeUser) => {
    if (expandedJudgeId === judge.id) {
      setExpandedJudgeId(null);
    } else {
      setExpandedJudgeId(judge.id);
      setEditBio(judge.judge_bio || '');
      setEditSpecialty(judge.judge_specialty || '');
      setEditBadge(judge.judge_badge);
      setEditStyle(judge.review_style || 'full_qoi');
    }
  };

  const handleSaveJudge = async (judgeId: string) => {
    setSaving(judgeId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          judge_bio: editBio || null,
          judge_specialty: editSpecialty || null,
          judge_badge: editBadge,
          review_style: editStyle,
        })
        .eq('id', judgeId);

      if (error) throw error;

      toast.success('Judge profile updated!');
      setExpandedJudgeId(null);
      fetchJudges();
    } catch (error: any) {
      console.error('Error updating judge:', error);
      toast.error(error.message || 'Failed to update judge');
    } finally {
      setSaving(null);
    }
  };

  const filteredJudges = judges.filter(j => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return j.username.toLowerCase().includes(query) || j.display_name?.toLowerCase().includes(query);
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Gavel size={14} className="text-gold" />
          Judge Management
        </h2>
        <span className="text-xs text-gold">{judges.length} judges</span>
      </div>

      <Input
        placeholder="Search judges..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-3"
      />

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredJudges.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <Gavel className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No judges found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredJudges.map((judge) => (
            <div key={judge.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleExpandJudge(judge)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-1/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {judge.avatar_url ? (
                    <img src={judge.avatar_url} alt={judge.username} className="w-10 h-10 rounded-full object-cover border-2 border-gold/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                      {judge.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">@{judge.username}</p>
                      {judge.judge_badge && JUDGE_BADGES[judge.judge_badge] && (
                        <JudgeBadge badge={JUDGE_BADGES[judge.judge_badge]} size="sm" showTooltip={false} animate={false} />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {judge.totalReviews} reviews • Level {judge.level}
                    </p>
                  </div>
                </div>
                {expandedJudgeId === judge.id ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>

              {/* Expanded Edit Panel */}
              {expandedJudgeId === judge.id && (
                <div className="p-4 border-t border-border bg-surface-1 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Judge Bio */}
                  <div>
                    <Label className="text-sm">Judge Bio</Label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell editors about yourself..."
                      rows={2}
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* What they look for */}
                  <div>
                    <Label className="text-sm">What I Look For</Label>
                    <Input
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      placeholder="e.g. Clean transitions, emotional storytelling, beat sync..."
                      className="mt-1"
                    />
                  </div>

                  {/* Judge Badge Selection */}
                  <div>
                    <Label className="text-sm mb-2 block">Judge Badge</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(JUDGE_BADGES).map((badge) => (
                        <button
                          key={badge.id}
                          onClick={() => setEditBadge(editBadge === badge.id ? null : badge.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            editBadge === badge.id 
                              ? 'border-gold bg-gold/10' 
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{badge.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{badge.label}</p>
                              <p className="text-[9px] text-muted-foreground truncate">{badge.description}</p>
                            </div>
                            {editBadge === badge.id && (
                              <Check size={14} className="text-gold shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Style */}
                  <div>
                    <Label className="text-sm mb-2 block">Review Style</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(REVIEW_STYLES).map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setEditStyle(style.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            editStyle === style.id 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveJudge(judge.id)}
                    disabled={saving === judge.id}
                    className="w-full py-3 bg-gold text-black font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving === judge.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Judge Profile
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
