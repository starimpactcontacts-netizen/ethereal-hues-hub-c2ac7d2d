import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Initialize native app features
export async function initializeNativeApp() {
  if (!Capacitor.isNativePlatform()) {
    return; // Only run on iOS/Android
  }

  try {
    // Set status bar style (dark content on dark background)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#09090B' });
    
    // Hide splash screen after app is ready
    // The web app's LoadingScreen will take over
    await SplashScreen.hide();
    
    // Apply native-like scroll behavior
    applyNativeScrollBehavior();
  } catch (error) {
    console.error('Native initialization error:', error);
  }
}

// Disable pinch-to-zoom on iOS
export function disableZoom() {
  if (!Capacitor.isNativePlatform()) return;
  
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());
  
  // Also set viewport meta
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }
}

// Apply native scroll behavior - prevent bounce/overscroll reset
function applyNativeScrollBehavior() {
  if (!Capacitor.isNativePlatform()) return;
  
  // Add CSS to prevent iOS bounce that causes "reset" feel
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent iOS overscroll bounce on body */
    html, body {
      overscroll-behavior: none;
      -webkit-overflow-scrolling: touch;
    }
    
    /* Allow scrolling in specific containers */
    .scroll-container, 
    [data-scroll="true"],
    main {
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
  `;
  document.head.appendChild(style);
  
  // Prevent pull-to-refresh on document level
  document.body.style.overscrollBehavior = 'none';
}

// Check if running in native app
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Get platform name
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}
