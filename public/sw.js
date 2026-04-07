// public/sw.js - Service Worker for handling push notifications

// Install event - cache resources if needed
self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  // Claim all clients
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  console.log('Push message received:', event);

  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || '새 알림이 도착했습니다.',
      icon: '/default_profile.png', // You can change this to your app icon
      badge: '/default_profile.png',
      data: {
        type: data.type,
        notificationId: data.notificationId,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        postId: data.postId,
        commentId: data.commentId,
        chatRoomId: data.chatRoomId,
      },
      requireInteraction: true, // Keep notification visible until user interacts
      silent: false,
      tag: `notification-${data.notificationId}`, // Prevent duplicate notifications
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '새 알림', options)
    );
  } catch (error) {
    console.error('Error processing push data:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('새 알림', {
        body: '새 알림이 도착했습니다.',
        icon: '/default_profile.png',
      })
    );
  }
});

// Notification click event - handle when user clicks on notification
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);

  event.notification.close();

  const data = event.notification.data;
  let url = '/'; // Default to home

  // Navigate based on notification type
  if (data) {
    if (data.postId) {
      url = `/post/${data.postId}`;
    } else if (data.chatRoomId) {
      url = `/chat/${data.chatRoomId}`;
    }
    // Add more navigation logic as needed
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }

      // If no suitable window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});