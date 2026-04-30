import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

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

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio('/audio/lobby-music.mp3');
      a.loop = true;
      a.volume = 0.45;
      a.preload = 'auto';
      audioRef.current = a;
    }
    const audio = audioRef.current;

    const evaluate = () => {
      const inLobby = isLobbyPath(location.pathname) || window.__lobbyMusicActive === true;
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
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
}
