import { useEffect, useState } from "react";

let unlocked = false;
const subscribers = new Set<(value: boolean) => void>();

export const notifyBattleAudioUnlocked = () => {
  if (unlocked) return;
  unlocked = true;
  subscribers.forEach((subscriber) => subscriber(true));
};

export const isBattleAudioUnlocked = () => unlocked;

if (typeof window !== "undefined") {
  const unlock = () => notifyBattleAudioUnlocked();
  window.addEventListener("pointerdown", unlock, { passive: true, capture: true });
  window.addEventListener("touchstart", unlock, { passive: true, capture: true });
  window.addEventListener("click", unlock, { passive: true, capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
}

export function useBattleAudioUnlock() {
  const [audioUnlocked, setAudioUnlocked] = useState(unlocked);

  useEffect(() => {
    subscribers.add(setAudioUnlocked);
    return () => {
      subscribers.delete(setAudioUnlocked);
    };
  }, []);

  return audioUnlocked;
}