import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RadioSettings {
  autoplay_enabled: boolean;
  default_playlist: string; // 'loopgate' | 'myplaylist'
}

const DEFAULTS: RadioSettings = { autoplay_enabled: true, default_playlist: 'loopgate' };

export function useRadioSettings(userId: string | null) {
  const [settings, setSettings] = useState<RadioSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setSettings(DEFAULTS); setLoading(false); return; }
    supabase.from('user_radio_settings').select('*').eq('user_id', userId).single()
      .then(({ data }) => {
        if (data) {
          setSettings({
            autoplay_enabled: (data as any).autoplay_enabled ?? true,
            default_playlist: (data as any).default_playlist ?? 'loopgate',
          });
        }
        setLoading(false);
      });
  }, [userId]);

  const updateSetting = useCallback(async <K extends keyof RadioSettings>(key: K, value: RadioSettings[K]) => {
    if (!userId) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await supabase.from('user_radio_settings').upsert({
      user_id: userId,
      autoplay_enabled: updated.autoplay_enabled,
      default_playlist: updated.default_playlist,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  }, [userId, settings]);

  return { settings, loading, updateSetting };
}
