import { useEffect } from 'react';
import { playTap, playNav } from '@/lib/sounds';

/**
 * Attaches a global click listener that plays a subtle tap sound
 * on every interactive element (button, a, [role=button], tab, switch, etc.).
 * Uses event delegation so zero per-component wiring is needed.
 */
export function useGlobalTapSound() {
  useEffect(() => {
    const INTERACTIVE =
      'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="radio"], input[type="submit"]';

    // Bottom nav links get the nav sound
    const isNavLink = (el: Element) =>
      !!el.closest('nav') || !!el.closest('[data-nav]');

    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const interactive = target.closest(INTERACTIVE);
      if (!interactive) return;

      // Don't play sounds on text inputs, audio controls, or disabled elements
      if (
        interactive.hasAttribute('disabled') ||
        interactive.getAttribute('aria-disabled') === 'true'
      ) return;

      if (isNavLink(interactive)) {
        playNav();
      } else {
        playTap();
      }
    };

    // Use pointerdown for instant feedback (before click delay)
    document.addEventListener('pointerdown', handler as EventListener, { passive: true });
    return () => document.removeEventListener('pointerdown', handler as EventListener);
  }, []);
}
