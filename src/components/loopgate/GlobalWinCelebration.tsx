import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import BattleDecidedOverlay from './BattleDecidedOverlay';

const SEEN_KEY = 'loopgate-seen-wins-v1';

interface PendingWin {
  id: string;
  source: 'quick_fight' | 'battle';
  winnerUsername: string;
  winnerAvatarUrl: string | null;
  loserUsername?: string;
  color: 'red' | 'blue';
}

function getSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markSeen(key: string) {
  try {
    const seen = getSeen();
    seen.add(key);
    // Cap to last 200 to keep storage small
    const arr = Array.from(seen).slice(-200);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {}
}

/**
 * Globally celebrates wins for the logged-in user.
 * - Detects unseen completed Quick Fights / Battles where the user is the winner.
 * - Shows the cinematic BattleDecidedOverlay (with the "battle decided" SFX).
 * - Suppressed on /fight/* and /battle/* (those pages own the in-context reveal).
 */
export default function GlobalWinCelebration() {
  const { user } = useAuth();
  const location = useLocation();
  const [queue, setQueue] = useState<PendingWin[]>([]);
  const [active, setActive] = useState<PendingWin | null>(null);
  const inflightRef = useRef(false);

  const onBattlePage =
    location.pathname.startsWith('/fight/') ||
    location.pathname.startsWith('/battle/') ||
    location.pathname.startsWith('/quick-fight') ||
    location.pathname.startsWith('/cash-battle');

  // Initial scan + on user change
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const scan = async () => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        const seen = getSeen();
        const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();

        const [{ data: qfs }, { data: bs }] = await Promise.all([
          supabase
            .from('quick_fights')
            .select('id, player_1_id, player_2_id, player_1_username, player_2_username, player_1_avatar_url, player_2_avatar_url, winner_id, status, judged_at')
            .eq('status', 'completed')
            .eq('winner_id', user.id)
            .gte('judged_at', sinceIso)
            .order('judged_at', { ascending: false })
            .limit(10),
          supabase
            .from('battles')
            .select('id, challenger_id, opponent_id, challenger_username, opponent_username, challenger_avatar_url, opponent_avatar_url, winner_id, status, judged_at')
            .eq('status', 'completed')
            .eq('winner_id', user.id)
            .gte('judged_at', sinceIso)
            .order('judged_at', { ascending: false })
            .limit(10),
        ]);

        if (cancelled) return;

        const wins: PendingWin[] = [];

        (qfs || []).forEach((q: any) => {
          const key = `qf:${q.id}`;
          if (seen.has(key)) return;
          const isP1 = q.winner_id === q.player_1_id;
          wins.push({
            id: key,
            source: 'quick_fight',
            winnerUsername: isP1 ? q.player_1_username : q.player_2_username,
            winnerAvatarUrl: isP1 ? q.player_1_avatar_url : q.player_2_avatar_url,
            loserUsername: isP1 ? q.player_2_username : q.player_1_username,
            color: isP1 ? 'red' : 'blue',
          });
        });

        (bs || []).forEach((b: any) => {
          const key = `b:${b.id}`;
          if (seen.has(key)) return;
          const isChallenger = b.winner_id === b.challenger_id;
          wins.push({
            id: key,
            source: 'battle',
            winnerUsername: isChallenger ? b.challenger_username : b.opponent_username,
            winnerAvatarUrl: isChallenger ? b.challenger_avatar_url : b.opponent_avatar_url,
            loserUsername: isChallenger ? b.opponent_username : b.challenger_username,
            color: isChallenger ? 'red' : 'blue',
          });
        });

        if (wins.length) setQueue((prev) => [...prev, ...wins]);
      } finally {
        inflightRef.current = false;
      }
    };

    scan();

    // Realtime: react to a quick_fight or battle being judged in our favor
    const handleRow = (row: any, source: 'quick_fight' | 'battle') => {
      if (!row || row.status !== 'completed' || row.winner_id !== user.id) return;
      const key = `${source === 'quick_fight' ? 'qf' : 'b'}:${row.id}`;
      if (getSeen().has(key)) return;
      let pending: PendingWin;
      if (source === 'quick_fight') {
        const isP1 = row.winner_id === row.player_1_id;
        pending = {
          id: key,
          source,
          winnerUsername: isP1 ? row.player_1_username : row.player_2_username,
          winnerAvatarUrl: isP1 ? row.player_1_avatar_url : row.player_2_avatar_url,
          loserUsername: isP1 ? row.player_2_username : row.player_1_username,
          color: isP1 ? 'red' : 'blue',
        };
      } else {
        const isChallenger = row.winner_id === row.challenger_id;
        pending = {
          id: key,
          source,
          winnerUsername: isChallenger ? row.challenger_username : row.opponent_username,
          winnerAvatarUrl: isChallenger ? row.challenger_avatar_url : row.opponent_avatar_url,
          loserUsername: isChallenger ? row.opponent_username : row.challenger_username,
          color: isChallenger ? 'red' : 'blue',
        };
      }
      setQueue((prev) => (prev.some((p) => p.id === key) ? prev : [...prev, pending]));
    };

    const channel = supabase
      .channel('global-win-celebration')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quick_fights' },
        (payload) => handleRow(payload.new, 'quick_fight'),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'battles' },
        (payload) => handleRow(payload.new, 'battle'),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Promote next queued win to active when free + not on battle page
  useEffect(() => {
    if (active || onBattlePage) return;
    if (queue.length === 0) return;
    const [next, ...rest] = queue;
    setActive(next);
    setQueue(rest);
    markSeen(next.id);
  }, [queue, active, onBattlePage]);

  if (!active) return null;

  return (
    <BattleDecidedOverlay
      active={true}
      winnerUsername={active.winnerUsername}
      winnerAvatarUrl={active.winnerAvatarUrl}
      winnerColor={active.color}
      loserUsername={active.loserUsername}
      onDismiss={() => setActive(null)}
    />
  );
}