/**
 * OpsAdminDashboard — Comprehensive admin stats & quick-access panels
 * Renders at the top of the OpsPanel with real-time platform metrics.
 */
import { useState, useEffect } from "react";
import {
  Users, Trophy, DollarSign, Eye, TrendingUp, Activity,
  Shield, Swords, MessageCircle, BarChart3, Zap, Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformStats {
  totalUsers: number;
  activeToday: number;
  totalBattles: number;
  liveBattles: number;
  totalEvents: number;
  liveEvents: number;
  totalUnits: number;
  totalTournaments: number;
  pendingTournaments: number;
  pendingHostedComps: number;
  totalEarningsCents: number;
  totalViews: number;
  pendingPayouts: number;
  totalMessages: number;
}

export default function OpsAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          usersResult,
          activeResult,
          battlesResult,
          liveBattlesResult,
          eventsResult,
          liveEventsResult,
          unitsResult,
          tournamentsResult,
          pendingTournamentsResult,
          pendingHostedResult,
          earningsResult,
          payoutsResult,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("active_sessions").select("*", { count: "exact", head: true }).gte("last_seen", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from("battles").select("*", { count: "exact", head: true }),
          supabase.from("battles").select("*", { count: "exact", head: true }).in("status", ["accepted", "live"]),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "live"),
          supabase.from("crews").select("*", { count: "exact", head: true }),
          supabase.from("sanctioned_tournaments").select("*", { count: "exact", head: true }),
          supabase.from("sanctioned_tournaments").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("hosted_competitions").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("hosted_competitions").select("host_earnings_cents, view_count"),
          supabase.from("payout_requests" as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        const earningsData = earningsResult.data || [];
        const totalEarnings = earningsData.reduce((s: number, r: any) => s + (r.host_earnings_cents || 0), 0);
        const totalViews = earningsData.reduce((s: number, r: any) => s + (r.view_count || 0), 0);

        setStats({
          totalUsers: usersResult.count || 0,
          activeToday: activeResult.count || 0,
          totalBattles: battlesResult.count || 0,
          liveBattles: liveBattlesResult.count || 0,
          totalEvents: eventsResult.count || 0,
          liveEvents: liveEventsResult.count || 0,
          totalUnits: unitsResult.count || 0,
          totalTournaments: tournamentsResult.count || 0,
          pendingTournaments: pendingTournamentsResult.count || 0,
          pendingHostedComps: pendingHostedResult.count || 0,
          totalEarningsCents: totalEarnings,
          totalViews,
          pendingPayouts: payoutsResult.count || 0,
          totalMessages: 0,
        });
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-foreground" },
    { label: "Active Today", value: stats.activeToday.toLocaleString(), icon: Activity, color: "text-emerald-400", pulse: true },
    { label: "Live Battles", value: `${stats.liveBattles}/${stats.totalBattles}`, icon: Swords, color: "text-destructive" },
    { label: "Live Events", value: `${stats.liveEvents}/${stats.totalEvents}`, icon: Trophy, color: "text-primary" },
    { label: "Units", value: stats.totalUnits.toLocaleString(), icon: Shield, color: "text-violet-400" },
    { label: "Tournaments", value: stats.totalTournaments.toLocaleString(), icon: Crown, color: "text-amber-400" },
    { label: "Total Views", value: stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews.toString(), icon: Eye, color: "text-sky-400" },
    { label: "Revenue", value: `$${(stats.totalEarningsCents / 100).toFixed(0)}`, icon: DollarSign, color: "text-emerald-400" },
  ];

  const alerts = [
    stats.pendingTournaments > 0 && { label: `${stats.pendingTournaments} tournament proposals`, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    stats.pendingHostedComps > 0 && { label: `${stats.pendingHostedComps} hosted comp proposals`, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    stats.pendingPayouts > 0 && { label: `${stats.pendingPayouts} pending payouts`, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <div className="space-y-3">
      {/* Stats Grid */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Platform Overview
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {statCards.map((card) => (
            <div key={card.label} className="bg-muted/20 rounded-lg p-2.5 text-center">
              <card.icon className={`w-4 h-4 mx-auto mb-1 ${card.color}`} />
              <p className={`text-lg font-black leading-none ${card.color}`}>{card.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Required Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <div key={alert.label} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${alert.color} flex items-center gap-1.5`}>
              <Zap className="w-3 h-3" />
              {alert.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
