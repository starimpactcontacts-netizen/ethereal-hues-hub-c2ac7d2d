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
    scheme: 'Loopgate',
    // Full-screen mode
    backgroundColor: '#09090B',
    // Disable zooming
    scrollEnabled: true,
    allowsLinkPreview: false
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
    // Enable pull-to-refresh
    PullToRefresh: {
      enabled: true
    },
    // Keyboard handling
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
