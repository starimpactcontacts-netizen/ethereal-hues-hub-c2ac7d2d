import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Flame, User, ArrowLeft, Play, Zap, TrendingUp, Star, MessageSquare, Send, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import loopgateBrand from '@/assets/loopgate-brand.png';

const luxuryFont = { fontFamily: "'Bebas Neue', sans-serif" };
const headerFont = { fontFamily: "'Jost', 'Futura', sans-serif", fontWeight: 400, letterSpacing: '0.25em' };

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Summer Vibes Drop', tier: 'Standard Slot', status: 'Live', edits: 47, battles: 12, feedHits: 1240000, judges: 3, date: 'Feb 10, 2026' },
  { id: '2', name: 'Brand X Takeover', tier: 'Takeover Slot', status: 'Completed', edits: 128, battles: 34, feedHits: 8700000, judges: 8, date: 'Jan 15, 2026' },
];

export default function EnterpriseClientDashboard() {
  const navigate = useNavigate();
  const [dashTab, setDashTab] = useState<'active' | 'archived'>('active');
  const [feedback, setFeedback] = useState('');

  const activeCampaigns = MOCK_CAMPAIGNS.filter(c => c.status === 'Live');
  const archivedCampaigns = MOCK_CAMPAIGNS.filter(c => c.status === 'Completed');
  const displayedCampaigns = dashTab === 'active' ? activeCampaigns : archivedCampaigns;

  // Aggregate stats
  const totalEdits = MOCK_CAMPAIGNS.reduce((s, c) => s + c.edits, 0);
  const totalBattles = MOCK_CAMPAIGNS.reduce((s, c) => s + c.battles, 0);
  const totalHits = MOCK_CAMPAIGNS.reduce((s, c) => s + c.feedHits, 0);
  const totalJudges = MOCK_CAMPAIGNS.reduce((s, c) => s + c.judges, 0);

  const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: '#060606' }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.04]" style={{ background: 'rgba(6,6,6,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/enterprise')} className="text-white/20 hover:text-white/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={loopgateBrand} alt="LOOPGATE" className="h-3.5 w-auto opacity-70" />
          </div>
          <span className="text-[8px] text-white/15 uppercase tracking-[0.3em]" style={headerFont}>Command Center</span>
        </div>
      </header>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] backdrop-blur-2xl" style={{ background: 'rgba(6,6,6,0.92)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3, action: () => {}, active: true },
            { id: 'slots', label: 'Slots', icon: Flame, action: () => navigate('/enterprise') },
            { id: 'account', label: 'Account', icon: User, action: () => navigate('/enterprise/account') },
          ].map(tab => (
            <button key={tab.id} onClick={tab.action} className={`flex flex-col items-center gap-0.5 transition-colors px-4 py-1 ${tab.active ? 'text-white/80' : 'text-white/30 hover:text-white/70'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[8px] uppercase tracking-[0.15em]" style={headerFont}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="pt-16 px-5 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[8px] text-white/15 uppercase tracking-[0.5em] mb-2" style={headerFont}>Client Portal</p>
          <h1 className="text-4xl text-white/90 tracking-[-0.01em]" style={luxuryFont}>Your Command Center</h1>
          <p className="text-[11px] text-white/20 mt-2">Every metric, every campaign. All in one place.</p>
        </motion.div>

        {/* Aggregate Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-[1px] bg-white/[0.04] mb-8">
          {[
            { label: 'Edits', value: totalEdits },
            { label: '1v1 Battles', value: totalBattles },
            { label: 'Feed Hits', value: formatNum(totalHits) },
            { label: 'Judges', value: totalJudges },
          ].map(stat => (
            <div key={stat.label} className="p-4 text-center" style={{ background: '#0A0A0A' }}>
              <p className="text-2xl text-white/70 tabular-nums" style={luxuryFont}>{stat.value}</p>
              <p className="text-[7px] text-white/15 uppercase tracking-[0.2em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Campaign Tabs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-6 mb-5">
            <p className="text-[9px] text-white/15 uppercase tracking-[0.5em]" style={headerFont}>Your Campaigns</p>
            <div className="flex gap-1">
              {(['active', 'archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDashTab(tab)}
                  className={`text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 transition-colors ${dashTab === tab ? 'text-white/70 bg-white/[0.06]' : 'text-white/15 hover:text-white/30'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {displayedCampaigns.length > 0 ? (
            <div className="space-y-3">
              {displayedCampaigns.map(campaign => (
                <div key={campaign.id} className="border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <Play className="w-4 h-4 text-white/20" />
                      </div>
                      <div>
                        <h3 className="text-xl text-white/90" style={luxuryFont}>{campaign.name}</h3>
                        <p className="text-[9px] text-white/20 uppercase tracking-wider">{campaign.tier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] uppercase tracking-wider px-3 py-1 ${campaign.status === 'Live' ? 'text-[#1B4332] border border-[#1B4332]/20 bg-[#1B4332]/5' : 'text-white/20 border border-white/5'}`}>
                        {campaign.status === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1B4332] mr-1.5 animate-pulse" />}
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-[1px] bg-white/[0.03]">
                    {[
                      { label: 'Edits', value: campaign.edits },
                      { label: '1v1 Battles', value: campaign.battles },
                      { label: 'Feed Hits', value: formatNum(campaign.feedHits) },
                      { label: 'Judges', value: campaign.judges },
                    ].map(stat => (
                      <div key={stat.label} className="p-3 text-center" style={{ background: '#0A0A0A' }}>
                        <p className="text-lg text-white/70 tabular-nums" style={luxuryFont}>{stat.value}</p>
                        <p className="text-[7px] text-white/15 uppercase tracking-[0.2em] mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between border-t border-white/[0.03]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-white/10" />
                      <span className="text-[8px] text-white/15">{campaign.date}</span>
                    </div>
                    <button className="text-[8px] text-white/15 hover:text-white/40 uppercase tracking-wider flex items-center gap-1 transition-colors">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-white/[0.03] p-12 text-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <Clock className="w-5 h-5 text-white/10 mx-auto mb-3" />
              <p className="text-[10px] text-white/10 uppercase tracking-wider">No {dashTab} campaigns</p>
            </div>
          )}
        </motion.div>

        {/* Smart Conversion: "Run It Back" CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
          <button
            onClick={() => navigate('/enterprise')}
            className="w-full border border-white/[0.06] p-6 text-left hover:border-white/[0.12] transition-all group"
            style={{ background: 'linear-gradient(135deg, rgba(224,0,0,0.03) 0%, rgba(10,10,10,1) 100%)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] text-[#E00000]/40 uppercase tracking-[0.4em] mb-1">Ready for More?</p>
                <h3 className="text-xl text-white/70" style={luxuryFont}>Launch Another Campaign</h3>
                <p className="text-[10px] text-white/15 mt-1">Your next slot is one click away.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-[#E00000]/40 transition-colors" />
            </div>
          </button>
        </motion.div>

        {/* Feedback Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10 border border-white/[0.06] p-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-white/15" />
            <p className="text-[9px] text-white/20 uppercase tracking-[0.4em]" style={headerFont}>Direct Line</p>
          </div>
          <h3 className="text-lg text-white/60 mb-1" style={luxuryFont}>Send Feedback to the Team</h3>
          <p className="text-[10px] text-white/12 mb-4">Tell us what you want, what's missing, or how to make the next campaign even better.</p>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type your message..."
            className="bg-white/[0.02] border-white/[0.06] text-sm placeholder:text-white/10 focus:border-white/20 rounded-none min-h-[80px] resize-none mb-3"
            maxLength={1000}
          />
          <Button
            onClick={() => { toast.success('Feedback sent. We hear you.'); setFeedback(''); }}
            disabled={!feedback.trim()}
            className="bg-white/[0.06] hover:bg-white/[0.1] text-white/50 h-10 px-6 text-[9px] uppercase tracking-[0.3em] rounded-none border border-white/[0.06]"
          >
            <Send className="w-3 h-3 mr-2" /> Send
          </Button>
        </motion.div>

        {/* Confidence Builder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-10 grid grid-cols-2 gap-[1px] bg-white/[0.04] mb-10">
          {[
            { value: '2.4M+', label: 'Average Reach Per Campaign' },
            { value: '48h', label: 'Average Turnaround' },
            { value: '92%', label: 'Client Return Rate' },
            { value: '24/7', label: 'Dedicated Support' },
          ].map(stat => (
            <div key={stat.label} className="p-5 text-center" style={{ background: '#0A0A0A' }}>
              <p className="text-2xl text-white/50 tabular-nums" style={luxuryFont}>{stat.value}</p>
              <p className="text-[7px] text-white/12 uppercase tracking-[0.15em] mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
