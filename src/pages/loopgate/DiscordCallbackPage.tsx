import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function DiscordCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = params.get('error');
    const code = params.get('code');

    if (errorParam) {
      setErr('Discord authorization was cancelled or denied.');
      return;
    }
    if (!code) {
      setErr('No authorization code received from Discord.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/discord-callback?code=${encodeURIComponent(code)}`);
        const json = await res.json();

        if (!res.ok || json.error) {
          setErr(json.error || 'Authentication failed. Please try again.');
          return;
        }

        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: json.token_hash,
          type: 'magiclink',
        });

        if (verifyErr) {
          setErr(verifyErr.message);
          return;
        }

        navigate(json.isNew ? '/onboarding' : '/hub', { replace: true });
      } catch {
        setErr('Something went wrong. Please try again.');
      }
    })();
  }, []);

  if (err) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-400">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-red-400 text-center">{err}</p>
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
      <div
        className="w-10 h-10 rounded-full border-2 border-[#5865F2] animate-spin"
        style={{ borderTopColor: 'transparent' }}
      />
      <p className="text-sm text-muted-foreground">Connecting with Discord…</p>
    </div>
  );
}
