import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface Props {
  returnTo?: string;
  label?: string;
}

export default function AppleSignInButton({ returnTo, label = 'Continue with Apple' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const redirectBase = window.location.origin;
      const redirect_uri = returnTo
        ? `${redirectBase}${returnTo.startsWith('/') ? returnTo : '/' + returnTo}`
        : redirectBase;
      const result = await lovable.auth.signInWithOAuth('apple', { redirect_uri });
      if (result.error) {
        toast.error(result.error.message || 'Apple sign-in failed');
        setLoading(false);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Apple sign-in failed');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-12 rounded-[14px] bg-white text-black text-[15px] font-semibold flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50 transition"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
            <path d="M13.07 9.5c-.02-2.13 1.74-3.15 1.82-3.2-.99-1.45-2.54-1.65-3.09-1.67-1.32-.13-2.57.77-3.24.77-.67 0-1.7-.75-2.8-.73-1.44.02-2.77.84-3.51 2.13-1.5 2.6-.38 6.45 1.07 8.56.71 1.04 1.56 2.2 2.66 2.16 1.07-.04 1.47-.69 2.77-.69s1.66.69 2.79.67c1.15-.02 1.88-1.05 2.58-2.09.82-1.2 1.15-2.36 1.17-2.42-.03-.01-2.24-.86-2.27-3.4zM10.99 3.3c.59-.71.99-1.7.88-2.69-.85.04-1.88.57-2.49 1.28-.55.63-1.03 1.64-.9 2.61.95.07 1.92-.48 2.51-1.2z"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
