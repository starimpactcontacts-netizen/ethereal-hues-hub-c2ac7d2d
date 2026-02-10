import { useState, useEffect } from 'react';
import { Gavel, Inbox, CheckCircle, BarChart3, ArrowLeft, Star, Palette, Video, Zap, Target, Swords, User, Disc3 } from 'lucide-react';
import JudgeOnboardingCard, { useJudgeOnboarding } from '@/components/loopgate/JudgeOnboardingCard';
import JudgeFormatInfo from '@/components/loopgate/JudgeFormatInfo';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import JudgeInbox from '@/components/loopgate/JudgeInbox';
import JudgeLiveFeed from '@/components/loopgate/JudgeLiveFeed';
import CompletedReviewsList from '@/components/loopgate/CompletedReviewsList';
import CardTemplatePreview from '@/components/loopgate/CardTemplatePreview';
import JudgePanelStats from '@/components/loopgate/JudgePanelStats';
import SubmitRatingVideoModal from '@/components/loopgate/SubmitRatingVideoModal';
import JudgeFlywheel from '@/components/loopgate/JudgeFlywheel';
import JudgeScoringModal from '@/components/loopgate/JudgeScoringModal';
import JudgeMissionsPanel from '@/components/loopgate/JudgeMissionsPanel';
import JudgeDivisionBadge from '@/components/loopgate/JudgeDivisionBadge';
import Judge1v1Rating from '@/components/loopgate/Judge1v1Rating';

type JudgeFormat = 'solo' | '1v1' | 'flywheel';

const SOLO_INFO = {
  title: 'Solo Edit Rating',
  description: 'Rate individual edits submitted to your inbox. The classic judge format — editors submit, you score, export the result card.',
  steps: [
    'Share your judge link so editors submit to your inbox',
    'Watch their edit and pick a scoring mode (QOI, 1-10, Tier, etc.)',
    'Score and export the result card for your TikTok/Reels',
    'Editors get notified, see their score, and come back for more',
  ],
  contentTip: 'Screen record yourself reacting + scoring for the best engagement. The result card auto-brands with Loopgate.',
};

const VS_INFO = {
  title: '1v1 Edit Rating',
  description: 'Compare two edits head-to-head, pick a winner, and auto-generate a TikTok-ready VS result card.',
  steps: [
    'Upload screenshots or thumbnails of both edits',
    'Enter both editor usernames',
    'Pick the winner and set scores',
    'Export the VS card — screen record or screenshot for content',
  ],
  contentTip: 'Show 5 sec of each edit in your video, then reveal the result card. Editors go crazy for revenge matches.',
};

const FLYWHEEL_INFO = {
  title: 'Flywheel Spin',
  description: 'Spin a cinematic wheel of your inbox submissions to randomly pick who gets rated next. Perfect for live content and TikTok.',
  steps: [
    'Your inbox submissions auto-load onto the wheel',
    'Hit spin — the wheel picks a random editor with a cinematic reveal',
    'The scoring modal opens automatically for the winner',
    'Record the full spin + scoring for a viral TikTok clip',
  ],
  contentTip: 'The spin animation is designed for screen recording. Use the fullscreen mode for 9:16 TikTok export with Loopgate branding baked in.',
};

export default function JudgePanelPage() {
  const { profile, user } = useAuth();
  const [activeFormat, setActiveFormat] = useState<JudgeFormat>('solo');
  const [activeTab, setActiveTab] = useState('inbox');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFlywheel, setShowFlywheel] = useState(false);
  const [flywheelEditors, setFlywheelEditors] = useState<any[]>([]);
  const [scoringFromFlywheel, setScoringFromFlywheel] = useState<any>(null);
  const onboarding = useJudgeOnboarding();

  // Fetch inbox editors for flywheel
  useEffect(() => {
    if (!user?.id) return;
    const fetchInbox = async () => {
      const { data: inboxData } = await supabase
        .from('judge_inbox')
        .select('review_request_id')
        .eq('judge_id', user.id)
        .eq('dismissed', false)
        .order('added_at', { ascending: false });

      if (!inboxData || inboxData.length === 0) {
        setFlywheelEditors([]);
        return;
      }

      const requestIds = inboxData.map(i => i.review_request_id);
      const { data: requests } = await supabase
        .from('review_requests')
        .select('id, user_id, username, avatar_url, submission_url, platform')
        .in('id', requestIds);

      setFlywheelEditors(requests || []);
    };
    fetchInbox();
  }, [user?.id]);

  // Auto-open flywheel when switching to flywheel format
  useEffect(() => {
    if (activeFormat === 'flywheel') {
      setShowFlywheel(true);
    }
  }, [activeFormat]);

  return (
    <div className="min-h-screen bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header — compact mobile-first */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Link to="/judges">
              <button className="p-1.5 hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-red-950 flex items-center justify-center">
                <Gavel className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div>
                <h1 className="font-display text-sm font-bold text-white tracking-wide">JUDGE PANEL</h1>
                <p className="text-[10px] text-zinc-500 font-mono">@{profile?.username || 'judge'}</p>
              </div>
            </div>
          </div>
          
          {/* Action buttons — icon-only on mobile */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowVideoModal(true)}
              className="p-2 hover:bg-white/5 transition-colors rounded-sm"
              title="Videos"
            >
              <Video className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <button 
              onClick={() => setShowTemplates(true)}
              className="p-2 hover:bg-white/5 transition-colors rounded-sm"
              title="Cards"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <Link to={`/judge/${profile?.username}`}>
              <button className="p-2 hover:bg-white/5 transition-colors rounded-sm" title="Profile">
                <Star className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Division + Stats — compact */}
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <JudgeDivisionBadge jxp={profile?.judge_xp || 0} size="sm" showProgress />
        </div>
        <JudgePanelStats />
      </div>

      {/* FORMAT SELECTOR — 3 big clear tabs */}
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-mono mb-2">Rating Format</p>
        <div className="flex gap-2">
          {/* Solo */}
          <button
            onClick={() => setActiveFormat('solo')}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all border relative ${
              activeFormat === 'solo'
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <User className="w-4 h-4" />
            Solo
            <div className="absolute top-1 right-1">
              <JudgeFormatInfo {...SOLO_INFO} />
            </div>
          </button>

          {/* 1v1 */}
          <button
            onClick={() => setActiveFormat('1v1')}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all border relative ${
              activeFormat === '1v1'
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Swords className="w-4 h-4" />
            1v1
            <div className="absolute top-1 right-1">
              <JudgeFormatInfo {...VS_INFO} />
            </div>
          </button>

          {/* Flywheel */}
          <button
            onClick={() => setActiveFormat('flywheel')}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all border relative ${
              activeFormat === 'flywheel'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Disc3 className="w-4 h-4" />
            Flywheel
            <div className="absolute top-1 right-1">
              <JudgeFormatInfo {...FLYWHEEL_INFO} />
            </div>
          </button>
        </div>
      </div>

      {/* SOLO FORMAT */}
      {activeFormat === 'solo' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-black rounded-none border-b border-zinc-800 h-10 p-0">
            <TabsTrigger
              value="missions"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[10px] text-zinc-500 gap-1"
            >
              <Target className="w-3 h-3" />
              Missions
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[10px] text-zinc-500 gap-1"
            >
              <Inbox className="w-3 h-3" />
              Inbox
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[10px] text-zinc-500 gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              Done
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[10px] text-zinc-500 gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missions" className="mt-0">
            <JudgeMissionsPanel />
          </TabsContent>
          <TabsContent value="inbox" className="mt-0">
            <JudgeInbox />
          </TabsContent>
          <TabsContent value="completed" className="mt-0">
            <CompletedReviewsList />
          </TabsContent>
          <TabsContent value="feed" className="mt-0">
            <JudgeLiveFeed />
          </TabsContent>
        </Tabs>
      )}

      {/* 1v1 FORMAT */}
      {activeFormat === '1v1' && (
        <div className="px-3 pt-3">
          <Judge1v1Rating />
        </div>
      )}

      {/* FLYWHEEL FORMAT — inline prompt to spin */}
      {activeFormat === 'flywheel' && !showFlywheel && (
        <div className="px-3 pt-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950 flex items-center justify-center">
            <Disc3 className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">SPIN THE WHEEL</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[260px] mx-auto">
              {flywheelEditors.length > 0
                ? `${flywheelEditors.length} editor${flywheelEditors.length > 1 ? 's' : ''} loaded from your inbox`
                : 'No editors in inbox yet — share your judge link!'}
            </p>
          </div>
          <button
            onClick={() => setShowFlywheel(true)}
            disabled={flywheelEditors.length === 0}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Launch Flywheel
          </button>
        </div>
      )}

      {/* Card Template Preview Modal */}
      <CardTemplatePreview 
        isOpen={showTemplates} 
        onClose={() => setShowTemplates(false)} 
      />

      {/* Rating Video Submit Modal */}
      <SubmitRatingVideoModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)} 
      />

      {/* Flywheel */}
      <JudgeFlywheel
        isOpen={showFlywheel}
        onClose={() => setShowFlywheel(false)}
        editors={flywheelEditors}
        onSelect={(editor) => {
          setShowFlywheel(false);
          setScoringFromFlywheel(editor);
        }}
      />

      {/* Scoring from Flywheel */}
      {scoringFromFlywheel && (
        <JudgeScoringModal
          request={scoringFromFlywheel}
          onClose={() => setScoringFromFlywheel(null)}
          onComplete={() => setScoringFromFlywheel(null)}
        />
      )}

      {/* Judge Onboarding — shows 3 times */}
      <JudgeOnboardingCard isOpen={onboarding.show} onDismiss={onboarding.dismiss} />
    </div>
  );
}
