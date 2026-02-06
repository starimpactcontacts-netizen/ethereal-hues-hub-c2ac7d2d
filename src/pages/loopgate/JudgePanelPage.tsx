import { useState, useEffect } from 'react';
import { Gavel, Inbox, CheckCircle, BarChart3, ArrowLeft, Star, Palette, Video, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

export default function JudgePanelPage() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFlywheel, setShowFlywheel] = useState(false);
  const [flywheelEditors, setFlywheelEditors] = useState<any[]>([]);
  const [scoringFromFlywheel, setScoringFromFlywheel] = useState<any>(null);

  // Fetch inbox editors for flywheel
  useEffect(() => {
    if (!user?.id) return;
    const fetchInbox = async () => {
      const { data } = await supabase
        .from('review_requests')
        .select('id, user_id, username, avatar_url, submission_url, platform')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      setFlywheelEditors(data || []);
    };
    fetchInbox();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/judges">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <Gavel className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">Judge Panel</h1>
                <p className="text-xs text-muted-foreground">@{profile?.username || 'judge'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowFlywheel(true)}
              size="sm" 
              className="bg-gold text-black hover:bg-gold/90 font-display font-bold tracking-wider text-[10px]"
            >
              <Zap className="w-3 h-3 mr-1" />
              Flywheel
            </Button>
            <Button 
              onClick={() => setShowVideoModal(true)}
              variant="outline" 
              size="sm" 
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Video className="w-3 h-3 mr-1" />
              Videos
            </Button>
            <Button 
              onClick={() => setShowTemplates(true)}
              variant="outline" 
              size="sm" 
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Palette className="w-3 h-3 mr-1" />
              Cards
            </Button>
            <Link to={`/judge/${profile?.username}`}>
              <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
                <Star className="w-3 h-3 mr-1" />
                Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="p-4 border-b border-border">
        <JudgePanelStats />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-surface-1 rounded-none border-b border-border h-12 p-0">
          <TabsTrigger
            value="inbox"
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <Inbox className="w-4 h-4 mr-2" />
            Inbox
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="feed"
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Live Feed
          </TabsTrigger>
        </TabsList>

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
    </div>
  );
}
