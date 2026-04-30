import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const LOBBY_PATTERNS: RegExp[] = [
  /^\/arena\/friendly\/[^/]+/,            // FriendlyTournamentLobby
  /^\/arena\/cash-battle\/ready/,         // CashBattleReadyPage
  /^\/arena\/cash-battle\/[^/]+\/ready/,
  /^\/mission\/[^/]+\/lobby/,             // MissionLobbyPage
  /^\/missions\/[^/]+\/lobby/,
  /^\/competition\/[^/]+\/lobby/,         // CompetitionLobbyPage
  /^\/competitions\/[^/]+\/lobby/,
  /^\/quick-fight/,                       // matchmaking
  /^\/practice\/match/,
  /\/lobby$/,
  /\/queue$/,
  /\/matchmaking$/,
];

function isLobbyPath(pathname: string) {
  return LOBBY_PATTERNS.some((re) => re.test(pathname));
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

    const inLobby = isLobbyPath(location.pathname);
    if (inLobby) {
      const tryPlay = () => {
        audio.play().catch(() => {
          // Autoplay blocked — wait for first user gesture
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
      };
      tryPlay();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      // Pause on route change cleanup; effect will re-evaluate
    };
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
