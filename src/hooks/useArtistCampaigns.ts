import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  total_views: number;
  total_impressions: number;
  total_engagements: number;
  total_clicks: number;
  budget_cents: number;
  spent_cents: number;
  roi_percentage: number;
  goal_views: number;
  goal_label: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  slug: string | null;
  featured_artist_id: string | null;
  created_at: string;
  enterprise_clients?: { email: string; display_name: string | null };
  featured_artists?: { name: string; avatar_url: string | null } | null;
}

interface CampaignEdit {
  id: string;
  campaign_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  platform: string;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  editor_username: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

interface UpdateRequest {
  id: string;
  client_id: string;
  campaign_id: string | null;
  message: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  enterprise_clients?: { email: string; display_name: string | null };
}

async function callManage(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-campaigns', { body });
  if (error) throw new Error(error.message || 'Request failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useArtistCampaigns(clientId?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [edits, setEdits] = useState<CampaignEdit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const action = clientId ? 'get-campaigns' : 'get-all-campaigns';
      const params = clientId ? { action, client_id: clientId } : { action };
      const data = await callManage(params);
      setCampaigns(data.campaigns || []);
      setEdits(data.edits || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (params: Record<string, unknown>) => {
    const data = await callManage({ action: 'create-campaign', ...params });
    await fetchCampaigns();
    return data.campaign;
  }, [fetchCampaigns]);

  const updateCampaign = useCallback(async (campaign_id: string, updates: Record<string, unknown>) => {
    const data = await callManage({ action: 'update-campaign', campaign_id, ...updates });
    await fetchCampaigns();
    return data.campaign;
  }, [fetchCampaigns]);

  const deleteCampaign = useCallback(async (campaign_id: string) => {
    await callManage({ action: 'delete-campaign', campaign_id });
    await fetchCampaigns();
  }, [fetchCampaigns]);

  const addEdit = useCallback(async (params: Record<string, unknown>) => {
    const data = await callManage({ action: 'add-edit', ...params });
    await fetchCampaigns();
    return data.edit;
  }, [fetchCampaigns]);

  const updateEdit = useCallback(async (edit_id: string, updates: Record<string, unknown>) => {
    const data = await callManage({ action: 'update-edit', edit_id, ...updates });
    await fetchCampaigns();
    return data.edit;
  }, [fetchCampaigns]);

  const deleteEdit = useCallback(async (edit_id: string) => {
    await callManage({ action: 'delete-edit', edit_id });
    await fetchCampaigns();
  }, [fetchCampaigns]);

  const setClientPassword = useCallback(async (client_id: string, new_password: string) => {
    await callManage({ action: 'set-client-password', client_id, new_password });
  }, []);

  const requestUpdate = useCallback(async (client_id: string, campaign_id?: string, message?: string) => {
    await callManage({ action: 'request-update', client_id, campaign_id, message });
  }, []);

  const getEditsForCampaign = useCallback((campaignId: string) => {
    return edits.filter(e => e.campaign_id === campaignId);
  }, [edits]);

  return {
    campaigns,
    edits,
    loading,
    refresh: fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    addEdit,
    updateEdit,
    deleteEdit,
    setClientPassword,
    requestUpdate,
    getEditsForCampaign,
  };
}

export function useEnterpriseClients() {
  const [clients, setClients] = useState<Array<{ id: string; email: string; display_name: string | null; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await callManage({ action: 'get-clients' });
        setClients(data.clients || []);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { clients, loading };
}

export function useUpdateRequests() {
  const [requests, setRequests] = useState<UpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callManage({ action: 'get-update-requests' });
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resolveRequest = useCallback(async (request_id: string) => {
    await callManage({ action: 'resolve-request', request_id });
    await fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refresh: fetchRequests, resolveRequest };
}
