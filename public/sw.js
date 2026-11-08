self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'New Message',
      body: event.data.text(),
      url: '/channels',
    };
  }

  const title = payload.title || 'NexusPulse';
  const targetUrl = payload.url || (payload.groupId ? `/channels/${payload.groupId}` : '/channels');
  const tag = payload.groupId ? `channel-${payload.groupId}` : 'nexuspulse-notification';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If user is already focused on the exact channel, skip redundant OS popup
        const isFocusedOnChannel = clientList.some((client) => {
          try {
            const clientPath = new URL(client.url).pathname;
            return client.focused && clientPath === targetUrl;
          } catch {
            return false;
          }
        });

        if (isFocusedOnChannel) {
          return;
        }

        return self.registration.showNotification(title, {
          body: payload.body || 'You have a new message',
          tag,
          renotify: true,
          data: {
            url: targetUrl,
            groupId: payload.groupId,
          },
        });
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/channels';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

