import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, Inbox, CheckCircle, BarChart3, ArrowLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import JudgeInbox from '@/components/loopgate/JudgeInbox';
import JudgeLiveFeed from '@/components/loopgate/JudgeLiveFeed';

export default function JudgePanelPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('inbox');

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
          
          <Link to={`/judge/${profile?.username}`}>
            <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10">
              <Star className="w-3 h-3 mr-1" />
              My Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-border">
        <div className="bg-surface-1 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-gold">0</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="bg-surface-1 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">Reviewed</p>
        </div>
        <div className="bg-surface-1 rounded-xl p-3 text-center">
          <p className="text-2xl font-display font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
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
          <div className="p-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                No Completed Reviews Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Start reviewing submissions from your inbox to see them here.
              </p>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="feed" className="mt-0">
          <JudgeLiveFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
