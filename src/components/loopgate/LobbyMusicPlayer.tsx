import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

const LOBBY_PATTERNS: RegExp[] = [
  /^\/arena\/friendly\/[^/]+/,            // FriendlyTournamentLobby
  /^\/arena\/cash-battle\/ready/,         // CashBattleReadyPage
  /^\/arena\/cash-battle\/[^/]+\/ready/,
  /^\/quick-fight/,                       // matchmaking
  /^\/practice\/match/,
  /\/lobby$/,
  /\/queue$/,
  /\/matchmaking$/,
];

function isLobbyPath(pathname: string) {
  return LOBBY_PATTERNS.some((re) => re.test(pathname));
}

// Global signal so non-route states (e.g. matchmaking on Hub) can trigger music
declare global {
  interface Window {
    __lobbyMusicActive?: boolean;
  }
}

export function setLobbyMusicActive(active: boolean) {
  if (typeof window === 'undefined') return;
  window.__lobbyMusicActive = active;
  window.dispatchEvent(new CustomEvent('lobby-music-state', { detail: active }));
}

export default function LobbyMusicPlayer() {
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('lobby-music-muted') === '1';
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio('/audio/lobby-music.mp3');
      a.loop = true;
      a.volume = 0.45;
      a.preload = 'auto';
      audioRef.current = a;
    }
    const audio = audioRef.current;
    audio.muted = muted;

    const evaluate = () => {
      const inLobby = isLobbyPath(location.pathname) || window.__lobbyMusicActive === true;
      setVisible(inLobby);
      if (inLobby) {
        audio.play().catch(() => {
          const resume = () => {
            audio.play().catch(() => {});
            window.removeEventListener('pointerdown', resume);
            window.removeEventListener('keydown', resume);
            window.removeEventListener('touchstart', resume);
          };
          window.addEventListener('pointerdown', resume, { once: true });
          window.addEventListener('keydown', resume, { once: true });
          window.addEventListener('touchstart', resume, { once: true });
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    evaluate();
    const handler = () => evaluate();
    window.addEventListener('lobby-music-state', handler);
    return () => window.removeEventListener('lobby-music-state', handler);
  }, [location.pathname, muted]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try { localStorage.setItem('lobby-music-muted', next ? '1' : '0'); } catch {}
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? 'Unmute lobby music' : 'Mute lobby music'}
      className="fixed z-[2147483645] right-3 h-9 w-9 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white/85 flex items-center justify-center shadow-lg hover:bg-black/85 active:scale-95 transition"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
