import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Building2, Calendar, DollarSign, Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EnterpriseDashboard() {
  const { user, profile } = useAuth();
  const { roles } = useUserRoles(user?.id);
  
  const isEnterprise = roles.includes('enterprise');

  // Quick stats (placeholder for now)
  const stats = [
    { label: 'Active Campaigns', value: '0', icon: Calendar },
    { label: 'Total Reach', value: '—', icon: Users },
    { label: 'Budget Allocated', value: '$0', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-gold/5 to-transparent border-b border-border">
        <div className="px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold/10 border border-gold/30">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">
              Enterprise Portal
            </span>
          </div>
          <h1 className="font-display text-3xl mb-1">
            Welcome, {profile?.username || 'Client'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your campaigns and connect with elite editors
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface-1 border border-border p-4 text-center">
              <stat.icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
              <p className="font-display text-2xl">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <h2 className="font-display text-lg text-muted-foreground mb-3">
          Quick Actions
        </h2>
        <div className="space-y-2">
          <Button
            className="w-full justify-between bg-gold hover:bg-gold/90 text-gold-foreground h-14"
            disabled
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Campaign
            </span>
            <span className="text-xs opacity-70">Coming Soon</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-between border-border h-14"
            disabled
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Browse Elite Editors
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="px-4 py-4">
        <h2 className="font-display text-lg text-muted-foreground mb-3">
          Your Campaigns
        </h2>
        <div className="bg-surface-1 border border-border p-8 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">No active campaigns</p>
          <p className="text-xs text-muted-foreground">
            Your sponsored events and campaigns will appear here
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="px-4 py-4">
        <div className="bg-surface-1 border border-gold/20 p-4">
          <h3 className="font-display text-sm mb-2">Need Help?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Contact your dedicated account manager for campaign setup and support.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-gold/50 text-gold hover:bg-gold/10"
            onClick={() => window.location.href = 'mailto:team@loopgate.io'}
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
