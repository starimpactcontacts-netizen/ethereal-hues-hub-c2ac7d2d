import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CASH_BATTLE_DURATION_HOURS = 24;

export interface CashBattleApplication {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  demo_reel_url: string;
  pitch: string | null;
  agreed_to_terms: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export interface CashBattle {
  id: string;
  challenger_id: string;
  challenger_username: string;
  challenger_avatar_url: string | null;
  opponent_id: string | null;
  opponent_username: string | null;
  opponent_avatar_url: string | null;
  prize_cents: number;
  status: string;
  duration_hours: number;
  starts_at: string | null;
  ends_at: string | null;
  winner_id: string | null;
  created_at: string;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_campaign_id: string | null;
  scenepack_url: string | null;
  scenepack_youtube_url: string | null;
  scenepack_gdrive_url: string | null;
  challenger_accepted: boolean;
  opponent_accepted: boolean;
  challenger_accepted_at: string | null;
  opponent_accepted_at: string | null;
}

export interface CashBattleEntryResult {
  state: 'waiting' | 'live';
  battleId?: string;
}

export function useCashBattles() {
  const [battles, setBattles] = useState<CashBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchBattles();

    const channel = supabase
      .channel('cash-battles-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_battles' }, () => {
        void fetchBattles();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function fetchBattles() {
    const { data } = await supabase
      .from('cash_battles')
      .select('*')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    setBattles((data as any[]) || []);
    setLoading(false);
  }

  return { battles, loading, refetch: fetchBattles };
}

export function useMyCashBattleApplication() {
  const { user } = useAuth();
  const [application, setApplication] = useState<CashBattleApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchApplication();
  }, [user]);

  async function fetchApplication() {
    if (!user) return;
    const { data } = await supabase
      .from('cash_battle_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setApplication(data as any);
    setLoading(false);
  }

  async function joinPool(preferredApplicationId?: string): Promise<CashBattleEntryResult | false> {
    if (!user) return false;

    const { data: activeBattle } = await supabase
      .from('cash_battles')
      .select('id')
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in('status', ['upcoming', 'live'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeBattle?.id) {
      return { state: 'live', battleId: activeBattle.id };
    }

    const { data: existingApplication } = await supabase
      .from('cash_battle_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    const queuePayload = {
      username: profile?.username || 'Unknown',
      avatar_url: profile?.avatar_url,
      demo_reel_url: '-',
      agreed_to_terms: true,
    };

    const tryCreateLiveBattle = async (openApplication: CashBattleApplication): Promise<CashBattleEntryResult | false> => {
      const { data: claimedApplication, error: claimError } = await supabase
        .from('cash_battle_applications')
        .update({ status: 'matched' } as any)
        .eq('id', openApplication.id)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();

      if (claimError) {
        toast.error('Failed to join');
        return false;
      }

      if (claimedApplication) {
        const now = new Date();
        const nowIso = now.toISOString();
        const endsAtIso = new Date(now.getTime() + CASH_BATTLE_DURATION_HOURS * 60 * 60 * 1000).toISOString();

        const { data: createdBattle, error: createError } = await supabase
          .from('cash_battles')
          .insert({
            challenger_id: claimedApplication.user_id,
            challenger_username: claimedApplication.username,
            challenger_avatar_url: claimedApplication.avatar_url,
            opponent_id: user.id,
            opponent_username: queuePayload.username,
            opponent_avatar_url: queuePayload.avatar_url,
            duration_hours: CASH_BATTLE_DURATION_HOURS,
            status: 'live',
            starts_at: nowIso,
            ends_at: endsAtIso,
            challenger_accepted: true,
            opponent_accepted: true,
            challenger_accepted_at: nowIso,
            opponent_accepted_at: nowIso,
          } as any)
          .select('id')
          .single();

        if (createError || !createdBattle?.id) {
          await supabase
            .from('cash_battle_applications')
            .update({ status: 'pending' } as any)
            .eq('id', claimedApplication.id);
          toast.error('Failed to start battle');
          return false;
        }

        const ownApplicationMutation = existingApplication?.id
          ? supabase
              .from('cash_battle_applications')
              .update({
                ...queuePayload,
                status: 'matched',
                matched_battle_id: createdBattle.id,
              } as any)
              .eq('id', existingApplication.id)
          : supabase
              .from('cash_battle_applications')
              .insert({
                user_id: user.id,
                ...queuePayload,
                status: 'matched',
                matched_battle_id: createdBattle.id,
              } as any);

        await Promise.all([
          supabase
            .from('cash_battle_applications')
            .update({ matched_battle_id: createdBattle.id } as any)
            .eq('id', claimedApplication.id),
          ownApplicationMutation,
        ]);

        await fetchApplication();
        return { state: 'live', battleId: createdBattle.id } as const;
      }

      return false;
    };

    const fetchTargetApplication = async (createdBefore?: string | null) => {
      if (preferredApplicationId) {
        const { data } = await supabase
          .from('cash_battle_applications')
          .select('*')
          .eq('id', preferredApplicationId)
          .eq('status', 'pending')
          .neq('user_id', user.id)
          .limit(1);

        return (((data as any[]) || [])[0] as CashBattleApplication | undefined) ?? null;
      }

      let query = supabase
        .from('cash_battle_applications')
        .select('*')
        .eq('status', 'pending')
        .neq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (createdBefore) {
        query = query.lt('created_at', createdBefore);
      }

      const { data } = await query;
      return (((data as any[]) || [])[0] as CashBattleApplication | undefined) ?? null;
    };

    // --- INSTANT MATCHMAKING: always try to pair first, regardless of own status ---

    // Step 1: check for ANY pending application (not ours)
    const openApplication = await fetchTargetApplication();
    if (openApplication) {
      // If we already have a pending application, that's fine — tryCreateLiveBattle will handle it
      const liveBattle = await tryCreateLiveBattle(openApplication);
      if (liveBattle) return liveBattle;
    }

    // Step 2: No one to pair with — place ourselves in the pool (or update existing)
    if (existingApplication?.status === 'pending') {
      // Already in pool, just wait
      setApplication(existingApplication as any);
      return { state: 'waiting' } as const;
    }

    const queueMutation = existingApplication?.id
      ? supabase
          .from('cash_battle_applications')
          .update({
            ...queuePayload,
            status: 'pending',
            matched_battle_id: null,
          } as any)
          .eq('id', existingApplication.id)
      : supabase.from('cash_battle_applications').insert({
          user_id: user.id,
          ...queuePayload,
        } as any);

    const { error } = await queueMutation;

    if (error) {
      const isDuplicate = error.code === '23505' || error.message?.toLowerCase().includes('duplicate');
      if (isDuplicate) {
        await fetchApplication();
        return { state: 'waiting' } as const;
      }
      toast.error('Failed to join');
      return false;
    }
    toast.success('You\'re in — waiting for opponent');
    await fetchApplication();

    // Step 3: One more immediate check — someone may have joined between our insert and now
    const lastChanceApp = await fetchTargetApplication();
    if (lastChanceApp) {
      const liveBattle = await tryCreateLiveBattle(lastChanceApp);
      if (liveBattle) return liveBattle;
    }

    return { state: 'waiting' } as const;
  }

  return { application, loading, joinPool, refetch: fetchApplication };
}

export function useAdminCashBattles() {
  const [applications, setApplications] = useState<CashBattleApplication[]>([]);
  const [battles, setBattles] = useState<CashBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [appsRes, battlesRes] = await Promise.all([
      supabase.from('cash_battle_applications').select('*').neq('status', 'cancelled').order('created_at', { ascending: false }),
      supabase.from('cash_battles').select('*').neq('status', 'cancelled').order('created_at', { ascending: false }),
    ]);
    setApplications((appsRes.data as any[]) || []);
    setBattles((battlesRes.data as any[]) || []);
    setLoading(false);
  }

  async function updateApplicationStatus(id: string, status: string, notes?: string) {
    await supabase.from('cash_battle_applications').update({
      status,
      admin_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    await fetchAll();
  }

  async function createMatch(challengerId: string, opponentId: string, prizeCents: number, durationHours: number, sponsor?: { name: string; logo_url?: string; campaign_id?: string }) {
    const challApp = applications.find(a => a.user_id === challengerId);
    const oppApp = applications.find(a => a.user_id === opponentId);
    if (!challApp || !oppApp) return;

    const { error } = await supabase.from('cash_battles').insert({
      challenger_id: challengerId,
      challenger_username: challApp.username,
      challenger_avatar_url: challApp.avatar_url,
      opponent_id: opponentId,
      opponent_username: oppApp.username,
      opponent_avatar_url: oppApp.avatar_url,
      prize_cents: prizeCents,
      duration_hours: durationHours,
      status: 'upcoming',
      sponsor_name: sponsor?.name || null,
      sponsor_logo_url: sponsor?.logo_url || null,
      sponsor_campaign_id: sponsor?.campaign_id || null,
    } as any);

    if (error) {
      toast.error('Failed to create match');
      return;
    }

    // Mark both as matched
    await Promise.all([
      supabase.from('cash_battle_applications').update({ status: 'matched' }).eq('user_id', challengerId),
      supabase.from('cash_battle_applications').update({ status: 'matched' }).eq('user_id', opponentId),
    ]);

    toast.success('Match created!');
    await fetchAll();
  }

  async function acceptBattle(battleId: string, userId: string) {
    const battle = battles.find(b => b.id === battleId);
    if (!battle) return false;

    const isChallenger = battle.challenger_id === userId;
    const updateField = isChallenger ? 'challenger_accepted' : 'opponent_accepted';
    const acceptedAtField = isChallenger ? 'challenger_accepted_at' : 'opponent_accepted_at';

    const { error } = await supabase.from('cash_battles').update({
      [updateField]: true,
      [acceptedAtField]: new Date().toISOString(),
    } as any).eq('id', battleId);

    if (error) return false;

    // Check if both accepted — if so, start the battle
    const otherAccepted = isChallenger ? battle.opponent_accepted : battle.challenger_accepted;
    if (otherAccepted) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + battle.duration_hours * 60 * 60 * 1000);
      await supabase.from('cash_battles').update({
        status: 'live',
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      }).eq('id', battleId);
    }

    await fetchAll();
    return true;
  }

  return { applications, battles, loading, updateApplicationStatus, createMatch, acceptBattle, refetch: fetchAll };
}

export function useMyCashBattles() {
  const { user } = useAuth();
  const [battles, setBattles] = useState<CashBattle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    void fetchBattles();

    const channel = supabase
      .channel(`my-cash-battles-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_battles' }, () => {
        void fetchBattles();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchBattles() {
    if (!user) return;
    const { data } = await supabase
      .from('cash_battles')
      .select('*')
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in('status', ['upcoming', 'live'])
      .order('created_at', { ascending: false });
    setBattles((data as any[]) || []);
    setLoading(false);
  }

  async function acceptBattle(battleId: string) {
    if (!user) return false;
    const battle = battles.find(b => b.id === battleId);
    if (!battle) return false;

    const isChallenger = battle.challenger_id === user.id;
    const updateField = isChallenger ? 'challenger_accepted' : 'opponent_accepted';
    const acceptedAtField = isChallenger ? 'challenger_accepted_at' : 'opponent_accepted_at';

    const { error } = await supabase.from('cash_battles').update({
      [updateField]: true,
      [acceptedAtField]: new Date().toISOString(),
    } as any).eq('id', battleId);

    if (error) return false;

    // Check if both accepted
    const otherAccepted = isChallenger ? battle.opponent_accepted : battle.challenger_accepted;
    if (otherAccepted) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + battle.duration_hours * 60 * 60 * 1000);
      await supabase.from('cash_battles').update({
        status: 'live',
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      }).eq('id', battleId);
    }

    await fetchBattles();
    return true;
  }

  return { battles, loading, acceptBattle, refetch: fetchBattles };
}
