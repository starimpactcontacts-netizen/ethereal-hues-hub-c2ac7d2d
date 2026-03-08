/**
 * PlatformAnalyticsAdmin — Signups over time, growth metrics, platform health
 */
import { useState, useEffect } from "react";
import { TrendingUp, Users, Calendar, Activity, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailySignup {
  date: string;
  count: number;
}

interface GrowthStats {
  signupsToday: number;
  signupsWeek: number;
  signupsMonth: number;
  battlesToday: number;
  submissionsToday: number;
  messagesToday: number;
}

export default function PlatformAnalyticsAdmin() {
  const [stats, setStats] = useState<GrowthStats | null>(null);
  const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [
          todaySignups,
          weekSignups,
          monthSignups,
          todayBattles,
          todaySubmissions,
          recentProfiles,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthAgo),
          supabase.from("battles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
          supabase.from("event_participations").select("*", { count: "exact", head: true }).gte("submitted_at", todayStart),
          supabase.from("profiles").select("created_at").gte("created_at", monthAgo).order("created_at", { ascending: true }),
        ]);

        setStats({
          signupsToday: todaySignups.count || 0,
          signupsWeek: weekSignups.count || 0,
          signupsMonth: monthSignups.count || 0,
          battlesToday: todayBattles.count || 0,
          submissionsToday: todaySubmissions.count || 0,
          messagesToday: 0,
        });

        // Aggregate daily signups for chart
        const dailyMap = new Map<string, number>();
        (recentProfiles.data || []).forEach((p: any) => {
          const day = p.created_at.slice(0, 10);
          dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
        });

        // Fill in missing days
        const days: DailySignup[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          days.push({ date: key, count: dailyMap.get(key) || 0 });
        }
        setDailySignups(days);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading || !stats) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="h-24 bg-muted/50 rounded" />
      </div>
    );
  }

  const maxCount = Math.max(...dailySignups.map(d => d.count), 1);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-400" />
          Growth Analytics
        </h2>
      </div>

      {/* Key Growth Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xl font-black text-emerald-400">{stats.signupsToday}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Today</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xl font-black text-primary">{stats.signupsWeek}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">This Week</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xl font-black">{stats.signupsMonth}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">30 Days</p>
        </div>
      </div>

      {/* Activity Today */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <Activity size={16} className="text-destructive" />
          <div>
            <p className="text-sm font-bold">{stats.battlesToday}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Battles Today</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <BarChart3 size={16} className="text-violet-400" />
          <div>
            <p className="text-sm font-bold">{stats.submissionsToday}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Submissions Today</p>
          </div>
        </div>
      </div>

      {/* Signup Sparkline (30 days) */}
      <div className="bg-card border border-border rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Signups — Last 30 Days
        </p>
        <div className="flex items-end gap-[2px] h-16">
          {dailySignups.map((day, i) => (
            <div
              key={day.date}
              className="flex-1 rounded-t-sm bg-primary/60 hover:bg-primary transition-colors relative group"
              style={{ height: `${Math.max((day.count / maxCount) * 100, 4)}%` }}
              title={`${day.date}: ${day.count} signups`}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-card border border-border px-1.5 py-0.5 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {day.count}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
          <span>{dailySignups[0]?.date.slice(5)}</span>
          <span>{dailySignups[dailySignups.length - 1]?.date.slice(5)}</span>
        </div>
      </div>
    </section>
  );
}
