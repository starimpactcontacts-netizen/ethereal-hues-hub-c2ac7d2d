import { useEffect } from "react";

export function useRecoverBodyScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const unlockScroll = () => {
      const hasOpenDialog = document.querySelector('[data-state="open"][role="dialog"]');
      if (hasOpenDialog) return;

      document.body.style.overflow = "";
      document.body.style.overflowY = "";
      document.body.style.pointerEvents = "";
      document.body.style.touchAction = "auto";
      document.body.removeAttribute("data-scroll-locked");

      document.documentElement.style.overflow = "";
      document.documentElement.style.overflowY = "";
      document.documentElement.style.pointerEvents = "";
      document.documentElement.style.touchAction = "auto";
      document.documentElement.removeAttribute("data-scroll-locked");
    };

    unlockScroll();

    const observer = new MutationObserver(unlockScroll);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] });

    const interval = window.setInterval(unlockScroll, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [enabled]);
}