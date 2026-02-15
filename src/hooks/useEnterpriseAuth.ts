import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TOKEN_KEY = 'enterprise_client_token';

interface EnterpriseClient {
  id: string;
  email: string;
  display_name?: string;
}

interface EnterpriseAuthState {
  client: EnterpriseClient | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

async function callAuth(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('enterprise-auth', { body });
  if (error) throw new Error(error.message || 'Auth request failed');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useEnterpriseAuth() {
  const [state, setState] = useState<EnterpriseAuthState>({
    client: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState({ client: null, isLoading: false, isAuthenticated: false });
      return;
    }
    callAuth({ action: 'verify-session', token })
      .then((data) => {
        if (data.authenticated) {
          setState({ client: data.client, isLoading: false, isAuthenticated: true });
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setState({ client: null, isLoading: false, isAuthenticated: false });
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ client: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const data = await callAuth({ action: 'signup', email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setState({ client: data.client, isLoading: false, isAuthenticated: true });
    return data;
  }, []);

  const signin = useCallback(async (email: string, password: string) => {
    const data = await callAuth({ action: 'signin', email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setState({ client: data.client, isLoading: false, isAuthenticated: true });
    return data;
  }, []);

  const sendOTP = useCallback(async (email: string) => {
    return await callAuth({ action: 'send-otp', email });
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    const data = await callAuth({ action: 'verify-otp', email, otp });
    localStorage.setItem(TOKEN_KEY, data.token);
    setState({ client: data.client, isLoading: false, isAuthenticated: true });
    return data;
  }, []);

  const signout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try { await callAuth({ action: 'logout', token }); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    setState({ client: null, isLoading: false, isAuthenticated: false });
  }, []);

  return {
    ...state,
    signup,
    signin,
    sendOTP,
    verifyOTP,
    signout,
  };
}
