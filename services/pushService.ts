// services/pushService.ts - Web Push notification service

import { apiClient } from "./apiClient";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface WebPushPublicKeyResponse {
  publicKey: string;
}

interface WebPushSubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Check if push notifications are supported
export const isPushSupported = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Get VAPID public key from backend
export const getVapidPublicKey = async (): Promise<string> => {
  const response = await apiClient<ApiResponse<WebPushPublicKeyResponse>>(
    '/api/v1/push/public-key',
    {
      method: 'GET',
    }
  );

  return response.data.publicKey;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushSupported()) {
    throw new Error('Service Worker is not supported');
  }

  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
  });

  console.log('Service Worker registered:', registration);

  // Wait for the service worker to be ready
  await navigator.serviceWorker.ready;

  return registration;
};

// Subscribe to push notifications
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('Push subscription created:', subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    throw error;
  }
};

// Send subscription to backend
export const sendSubscriptionToBackend = async (subscription: PushSubscription): Promise<void> => {
  const subscriptionData: WebPushSubscriptionRequest = {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
    auth: arrayBufferToBase64(subscription.getKey('auth')!),
  };

  await apiClient<ApiResponse<string>>('/api/v1/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscriptionData),
  });

  console.log('Subscription sent to backend');
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<void> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Send unsubscribe request to backend
      await apiClient<ApiResponse<string>>('/api/v1/push/subscriptions', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // Unsubscribe locally
      await subscription.unsubscribe();
      console.log('Successfully unsubscribed from push notifications');
    }
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    throw error;
  }
};

// Get current subscription
export const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return null;
  }
};

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Utility function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}