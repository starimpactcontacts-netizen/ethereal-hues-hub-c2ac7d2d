import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.loopgate.app',
  appName: 'Loopgate',
  webDir: 'dist',
  
  // Point to live website - acts as webview shell
  server: {
    url: 'https://loopgate.io',
    cleartext: true
  },
  
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'io.loopgate.app', // Custom URL scheme for deep links
    // Full-screen mode
    backgroundColor: '#09090B',
    // Disable zooming and bouncing
    scrollEnabled: true,
    allowsLinkPreview: false,
    // Prevent overscroll bounce
    overrideUserAgent: 'Loopgate iOS App'
  },
  
  plugins: {
    // Splash screen - shows while loading
    SplashScreen: {
      launchShowDuration: 0, // We control it manually
      launchAutoHide: false,
      backgroundColor: '#09090B',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false
    },
    // Status bar styling
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#09090B'
    },
    // Disable pull-to-refresh (we handle it ourselves or not at all)
    // This prevents the jarring page reload on scroll up
    // Keyboard handling
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
