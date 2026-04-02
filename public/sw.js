// Self-destructing service worker
// When the old SW fetches this file as an update, it will:
// 1. Skip waiting immediately
// 2. Delete ALL caches
// 3. Reload all open tabs
// 4. Unregister itself permanently
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Nuke every cache bucket
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      // Reload every open tab so they get fresh content
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map((c) => c.navigate(c.url)));
      // Kill this SW permanently
      await self.registration.unregister();
    })()
  );
});
