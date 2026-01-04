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

// Enable pull-to-refresh behavior
export function enablePullToRefresh() {
  if (!Capacitor.isNativePlatform()) return;
  
  let startY = 0;
  let isPulling = false;
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY;
      isPulling = true;
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].pageY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 100 && window.scrollY === 0) {
      window.location.reload();
      isPulling = false;
    }
  });
  
  document.addEventListener('touchend', () => {
    isPulling = false;
  });
}
