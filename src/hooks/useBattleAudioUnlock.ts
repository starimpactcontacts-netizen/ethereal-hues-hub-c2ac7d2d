import { useEffect, useState } from "react";

let unlocked = false;
const subscribers = new Set<(value: boolean) => void>();

const notifyUnlocked = () => {
  if (unlocked) return;
  unlocked = true;
  subscribers.forEach((subscriber) => subscriber(true));
};

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", notifyUnlocked, { passive: true });
  window.addEventListener("touchstart", notifyUnlocked, { passive: true });
  window.addEventListener("keydown", notifyUnlocked);
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