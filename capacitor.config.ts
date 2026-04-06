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
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scheme: 'io.loopgate.app',
    backgroundColor: '#000000',
    scrollEnabled: true,
    allowsLinkPreview: false,
    overrideUserAgent: 'Loopgate iOS App',
    webContentsDebuggingEnabled: false
  },
  
  plugins: {
    // Splash screen - shows while loading
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
      overlaysWebView: false
    },
    // Camera plugin for photo uploads
    Camera: {
      // iOS permissions are handled via Info.plist in Xcode
    },
    // Keyboard handling
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    // Capgo live updates - OTA updates without App Store review
    CapacitorUpdater: {
      autoUpdate: true
    }
  }
};

export default config;
