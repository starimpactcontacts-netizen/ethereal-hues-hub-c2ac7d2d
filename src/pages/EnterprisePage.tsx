import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  TrendingUp, 
  Plus, 
  BarChart3, 
  CreditCard,
  Download,
  Calendar,
  MapPin,
  DollarSign,
  Upload,
  Users,
  Trophy,
  FileText,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingScreen from '@/components/loopgate/LoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Check if user has enterprise role - NO DEV MODE BYPASS
function useEnterpriseAccess() {
  const { user, loading: authLoading } = useAuth();
  
  const { data: hasAccess, isLoading: roleLoading } = useQuery({
    queryKey: ['enterprise-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Direct database check - bypasses any dev mode logic
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'enterprise')
        .maybeSingle();
      
      return !!data && !error;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    hasAccess: hasAccess || false,
    loading: authLoading || roleLoading,
    userId: user?.id,
  };
}

// Mock data for demo
const mockCampaigns = [
  {
    id: '1',
    title: 'Summer Blockbuster Campaign',
    status: 'live',
    submissions: 247,
    avgQoi: 78.5,
    regions: ['Global'],
    prizePool: '$25,000',
    startDate: '2026-01-01',
    endDate: '2026-01-15',
  },
  {
    id: '2', 
    title: 'Franchise Revival Edit Challenge',
    status: 'upcoming',
    submissions: 0,
    avgQoi: 0,
    regions: ['NA', 'EU'],
    prizePool: '$15,000',
    startDate: '2026-01-20',
    endDate: '2026-02-01',
  },
  {
    id: '3',
    title: 'Award Season Promo',
    status: 'closed',
    submissions: 512,
    avgQoi: 82.3,
    regions: ['Global'],
    prizePool: '$50,000',
    startDate: '2025-12-01',
    endDate: '2025-12-20',
  },
];

const mockBilling = [
  {
    id: '1',
    campaign: 'Summer Blockbuster Campaign',
    amount: 25000,
    status: 'paid',
    date: '2025-12-28',
  },
  {
    id: '2',
    campaign: 'Franchise Revival Edit Challenge',
    amount: 15000,
    status: 'processing',
    date: '2026-01-05',
  },
  {
    id: '3',
    campaign: 'Award Season Promo',
    amount: 50000,
    status: 'paid',
    date: '2025-11-25',
  },
];

export default function EnterprisePage() {
  const { hasAccess, loading, userId } = useEnterpriseAccess();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state for new campaign
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    prizePool: '',
    region: 'global',
    startDate: '',
    endDate: '',
  });
  
  // STRICT SECURITY: No access without enterprise role
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }
  
  const handleCreateCampaign = async () => {
    if (!newCampaign.title || !newCampaign.startDate || !newCampaign.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // This would create the event in the system
    toast.success('Campaign created successfully');
    setNewCampaign({
      title: '',
      description: '',
      prizePool: '',
      region: 'global',
      startDate: '',
      endDate: '',
    });
  };
  
  const handleExportWinners = () => {
    toast.success('Winner pack exported to CSV');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Enterprise Header */}
      <header className="sticky top-0 z-50 bg-surface-0 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-foreground" />
              <span className="font-display text-xl">LOOPGATE</span>
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Enterprise</span>
            </div>
            
            {/* Enterprise Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-1 border border-border text-xs font-medium tracking-wider uppercase text-muted-foreground">
              <Shield className="w-3 h-3" />
              Enterprise Access · Restricted
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="font-display text-4xl mb-2">Studio Dashboard</h1>
            <p className="text-muted-foreground">Manage your competitive UGC campaigns</p>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-surface-1 border border-border p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-surface-0">
                <TrendingUp className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-surface-0">
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-surface-0">
                <BarChart3 className="w-4 h-4 mr-2" />
                Results
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-surface-0">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </TabsTrigger>
            </TabsList>
            
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Active Campaigns</p>
                  <p className="font-display text-3xl">2</p>
                </div>
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Submissions</p>
                  <p className="font-display text-3xl">759</p>
                </div>
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Avg. QOI Score</p>
                  <p className="font-display text-3xl">80.4</p>
                </div>
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Investment</p>
                  <p className="font-display text-3xl text-gold">$90K</p>
                </div>
              </div>
              
              {/* Campaigns List */}
              <div className="bg-surface-1 border border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="font-display text-xl">Your Campaigns</h2>
                </div>
                <div className="divide-y divide-border">
                  {mockCampaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-display text-lg">{campaign.title}</h3>
                          <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-0.5 ${
                            campaign.status === 'live' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : campaign.status === 'upcoming'
                              ? 'bg-gold/10 text-gold border border-gold/20'
                              : 'bg-surface-0 text-muted-foreground border border-border'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {campaign.submissions} submissions
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {campaign.regions.join(', ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {campaign.prizePool}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl">{campaign.avgQoi || '—'}</p>
                        <p className="text-xs text-muted-foreground uppercase">Avg QOI</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* CREATE CAMPAIGN TAB */}
            <TabsContent value="create" className="space-y-6">
              <div className="bg-surface-1 border border-border p-6">
                <h2 className="font-display text-2xl mb-6">Create New Campaign</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        value={newCampaign.title}
                        onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                        placeholder="e.g. Summer Blockbuster Challenge"
                        className="bg-surface-0 border-border mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCampaign.description}
                        onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                        placeholder="Describe the creative brief..."
                        className="bg-surface-0 border-border mt-1 min-h-[100px]"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="prizePool">Prize Pool ($)</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="prizePool"
                          type="number"
                          value={newCampaign.prizePool}
                          onChange={(e) => setNewCampaign({ ...newCampaign, prizePool: e.target.value })}
                          placeholder="10000"
                          className="bg-surface-0 border-border pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Region</Label>
                      <Select
                        value={newCampaign.region}
                        onValueChange={(value) => setNewCampaign({ ...newCampaign, region: value })}
                      >
                        <SelectTrigger className="bg-surface-0 border-border mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="na">North America</SelectItem>
                          <SelectItem value="eu">Europe</SelectItem>
                          <SelectItem value="apac">Asia Pacific</SelectItem>
                          <SelectItem value="latam">Latin America</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date *</Label>
                        <div className="relative mt-1">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="startDate"
                            type="date"
                            value={newCampaign.startDate}
                            onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                            className="bg-surface-0 border-border pl-9"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date *</Label>
                        <div className="relative mt-1">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="endDate"
                            type="date"
                            value={newCampaign.endDate}
                            onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                            className="bg-surface-0 border-border pl-9"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Asset Upload</Label>
                      <div className="mt-1 border-2 border-dashed border-border bg-surface-0 p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop reference pack, clips, or instructions
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ZIP, MP4, MOV up to 500MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border flex justify-end">
                  <Button 
                    onClick={handleCreateCampaign}
                    className="bg-foreground text-background hover:bg-foreground/90 font-display"
                  >
                    Launch Campaign
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* RESULTS TAB */}
            <TabsContent value="results" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Live Leaderboard Preview */}
                <div className="bg-surface-1 border border-border">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-display text-xl">Live Leaderboard</h2>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <div key={rank} className="p-3 flex items-center gap-4">
                        <span className={`font-display text-2xl w-8 ${rank === 1 ? 'text-gold' : 'text-muted-foreground'}`}>
                          {rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-surface-0 border border-border" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">editor_{rank}xx</p>
                          <p className="text-xs text-muted-foreground">Open League</p>
                        </div>
                        <span className="font-display text-lg">{95 - rank * 3}.{rank}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* QOI Distribution */}
                <div className="bg-surface-1 border border-border">
                  <div className="p-4 border-b border-border">
                    <h2 className="font-display text-xl">QOI Score Distribution</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { range: '90-100', count: 12, pct: 5 },
                      { range: '80-89', count: 45, pct: 18 },
                      { range: '70-79', count: 98, pct: 40 },
                      { range: '60-69', count: 67, pct: 27 },
                      { range: '< 60', count: 25, pct: 10 },
                    ].map((tier) => (
                      <div key={tier.range} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-14">{tier.range}</span>
                        <div className="flex-1 bg-surface-0 h-6 relative">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gold/30"
                            style={{ width: `${tier.pct}%` }}
                          />
                          <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                            {tier.count}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{tier.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Export Section */}
              <div className="bg-surface-1 border border-border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl mb-1">Export Winner Pack</h2>
                    <p className="text-sm text-muted-foreground">
                      Download CSV with top submissions, contact links, and QOI scores
                    </p>
                  </div>
                  <Button 
                    onClick={handleExportWinners}
                    variant="outline" 
                    className="border-border"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* BILLING TAB */}
            <TabsContent value="billing" className="space-y-6">
              {/* Billing Summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Spent</p>
                  <p className="font-display text-3xl">$90,000</p>
                </div>
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pending</p>
                  <p className="font-display text-3xl text-gold">$15,000</p>
                </div>
                <div className="bg-surface-1 border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Campaigns</p>
                  <p className="font-display text-3xl">3</p>
                </div>
              </div>
              
              {/* Invoices */}
              <div className="bg-surface-1 border border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="font-display text-xl">Invoices</h2>
                </div>
                <div className="divide-y divide-border">
                  {mockBilling.map((invoice) => (
                    <div key={invoice.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{invoice.campaign}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-0.5 ${
                          invoice.status === 'paid' 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : invoice.status === 'processing'
                            ? 'bg-gold/10 text-gold border border-gold/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {invoice.status}
                        </span>
                        <span className="font-display text-xl w-24 text-right">
                          ${invoice.amount.toLocaleString()}
                        </span>
                        <Button variant="ghost" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}