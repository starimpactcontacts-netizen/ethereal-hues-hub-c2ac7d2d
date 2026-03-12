import { useState, useEffect, useMemo } from 'react';
import { Gavel, Inbox, CheckCircle, BarChart3, ArrowLeft, Star, Palette, Video, Zap, Target, Swords, User, UserRound, Disc3, Award, Music } from 'lucide-react';
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
import JudgeQuickFightsTab from '@/components/loopgate/JudgeQuickFightsTab';
import JudgeQOIResultCard from '@/components/loopgate/JudgeQOIResultCard';
import JudgeSoloQueue from '@/components/loopgate/JudgeSoloQueue';
import JudgeDropQueue from '@/components/loopgate/JudgeDropQueue';

type JudgeFormat = 'solo' | '1v1' | 'qoi' | 'quick' | 'flywheel';

const FORMAT_INFO = {
  solo: {
    title: 'Solo Edit Rating',
    description: 'Rate individual edits submitted to your inbox.',
    steps: [
      'Share your judge link so editors submit to your inbox',
      'Watch their edit and pick a scoring mode',
      'Score and export the result card',
      'Editors get notified and see their score',
    ],
    contentTip: 'Screen record yourself reacting + scoring for the best engagement.',
  },
  '1v1': {
    title: '1v1 Edit Rating',
    description: 'Compare two edits head-to-head and pick a winner.',
    steps: [
      'Upload screenshots of both edits',
      'Enter both editor usernames',
      'Pick the winner and set scores',
      'Export the VS card for content',
    ],
    contentTip: 'Show 5 sec of each edit, then reveal the result card.',
  },
  flywheel: {
    title: 'Flywheel Spin',
    description: 'Spin a cinematic wheel to randomly pick who gets rated next.',
    steps: [
      'Your inbox submissions auto-load onto the wheel',
      'Hit spin — cinematic reveal',
      'Scoring modal opens automatically',
      'Record the full spin for a viral clip',
    ],
    contentTip: 'Use fullscreen mode for 9:16 TikTok export.',
  },
};

const FORMATS: { id: JudgeFormat; label: string; icon: typeof User; activeClass: string }[] = [
  { id: 'solo', label: 'Solo', icon: User, activeClass: 'bg-white text-black border-white' },
  { id: '1v1', label: '1v1', icon: Swords, activeClass: 'bg-white text-black border-white' },
  { id: 'qoi', label: 'QOI', icon: Award, activeClass: 'bg-yellow-500 text-black border-yellow-500' },
  { id: 'quick', label: 'Quick', icon: Zap, activeClass: 'bg-red-600 text-white border-red-600' },
  { id: 'flywheel', label: 'Wheel', icon: Disc3, activeClass: 'bg-red-600 text-white border-red-600' },
];

export default function JudgePanelPage() {
  const { profile, user } = useAuth();
  const [activeFormat, setActiveFormat] = useState<JudgeFormat>('solo');
  const [activeTab, setActiveTab] = useState('solo_queue');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFlywheel, setShowFlywheel] = useState(false);
  const [flywheelEditors, setFlywheelEditors] = useState<any[]>([]);
  const [scoringFromFlywheel, setScoringFromFlywheel] = useState<any>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
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

  // Auto-collapse stats on scroll
  useEffect(() => {
    const handleScroll = () => {
      setStatsCollapsed(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header — ultra compact */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Link to="/judges">
              <button className="p-1 hover:bg-white/5 transition-colors">
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-950 flex items-center justify-center">
                <Gavel className="w-3 h-3 text-red-400" />
              </div>
              <div className="leading-none">
                <h1 className="font-display text-xs font-bold text-white tracking-wide">JUDGE PANEL</h1>
                <p className="text-[9px] text-zinc-600 font-mono">@{profile?.username || 'judge'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            <button 
              onClick={() => setShowVideoModal(true)}
              className="p-1.5 hover:bg-white/5 transition-colors"
              title="Videos"
            >
              <Video className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button 
              onClick={() => setShowTemplates(true)}
              className="p-1.5 hover:bg-white/5 transition-colors"
              title="Cards"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <Link to={`/judge/${profile?.username}`}>
              <button className="p-1.5 hover:bg-white/5 transition-colors" title="Profile">
                <Star className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Division Badge — inline */}
      <div className="px-3 py-1.5 border-b border-zinc-800">
        <JudgeDivisionBadge jxp={profile?.judge_xp || 0} size="sm" showProgress />
      </div>

      {/* Stats — collapsible on scroll */}
      <div className={`px-3 border-b border-zinc-800 transition-all duration-300 overflow-hidden ${
        statsCollapsed ? 'max-h-0 py-0 border-b-0' : 'max-h-[300px] py-2'
      }`}>
        <JudgePanelStats />
      </div>

      {/* Format Selector — horizontal scroll, no wrapping */}
      <div className="px-3 py-2 border-b border-zinc-800">
        <p className="text-[8px] text-zinc-600 uppercase tracking-[0.25em] font-mono mb-1.5">Rating Format</p>
        <div className="flex gap-1">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isActive = activeFormat === fmt.id;
            const info = FORMAT_INFO[fmt.id as keyof typeof FORMAT_INFO];
            return (
              <button
                key={fmt.id}
                onClick={() => setActiveFormat(fmt.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[9px] font-bold transition-all border relative ${
                  isActive ? fmt.activeClass : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {fmt.label}
                {info && (
                  <div className="absolute top-0 right-0">
                    <JudgeFormatInfo {...info} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SOLO FORMAT */}
      {activeFormat === 'solo' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-black rounded-none border-b border-zinc-800 h-9 p-0">
            <TabsTrigger
              value="solo_queue"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <UserRound className="w-3 h-3" />
              Solo
            </TabsTrigger>
            <TabsTrigger
              value="drops"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <Music className="w-3 h-3" />
              Drops
            </TabsTrigger>
            <TabsTrigger
              value="missions"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <Target className="w-3 h-3" />
              Missions
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <Inbox className="w-3 h-3" />
              Inbox
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <CheckCircle className="w-3 h-3" />
              Done
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-white data-[state=active]:shadow-none text-[9px] text-zinc-600 gap-1"
            >
              <BarChart3 className="w-3 h-3" />
              Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="solo_queue" className="mt-0">
            <JudgeSoloQueue />
          </TabsContent>
          <TabsContent value="drops" className="mt-0">
            <JudgeDropQueue />
          </TabsContent>
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

      {/* QOI FORMAT */}
      {activeFormat === 'qoi' && (
        <div className="px-3 pt-3">
          <JudgeQOIResultCard />
        </div>
      )}

      {/* QUICK 1v1 FORMAT */}
      {activeFormat === 'quick' && (
        <JudgeQuickFightsTab />
      )}

      {/* FLYWHEEL FORMAT */}
      {activeFormat === 'flywheel' && !showFlywheel && (
        <div className="px-3 pt-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto bg-red-950 flex items-center justify-center">
            <Disc3 className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">SPIN THE WHEEL</h3>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-[240px] mx-auto">
              {flywheelEditors.length > 0
                ? `${flywheelEditors.length} editor${flywheelEditors.length > 1 ? 's' : ''} loaded from your inbox`
                : 'No editors in inbox yet — share your judge link!'}
            </p>
          </div>
          <button
            onClick={() => setShowFlywheel(true)}
            disabled={flywheelEditors.length === 0}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold text-sm transition-colors"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Launch Flywheel
          </button>
        </div>
      )}

      {/* Modals */}
      <CardTemplatePreview isOpen={showTemplates} onClose={() => setShowTemplates(false)} />
      <SubmitRatingVideoModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} />
      <JudgeFlywheel
        isOpen={showFlywheel}
        onClose={() => setShowFlywheel(false)}
        editors={flywheelEditors}
        onSelect={(editor) => {
          setShowFlywheel(false);
          setScoringFromFlywheel(editor);
        }}
      />
      {scoringFromFlywheel && (
        <JudgeScoringModal
          request={scoringFromFlywheel}
          onClose={() => setScoringFromFlywheel(null)}
          onComplete={() => setScoringFromFlywheel(null)}
        />
      )}
      <JudgeOnboardingCard isOpen={onboarding.show} onDismiss={onboarding.dismiss} />
    </div>
  );
}
