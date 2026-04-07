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
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

// Request notification permission from user
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isPushSupported()) {
      throw new Error("Push notifications are not supported in this browser");
    }

    const permission = await Notification.requestPermission();
    return permission;
  };

// Get VAPID public key from backend
export const getVapidPublicKey = async (): Promise<string> => {
  try {
    console.log("🔑 Requesting VAPID public key from backend...");
    const response = await apiClient<ApiResponse<WebPushPublicKeyResponse>>(
      "/api/v1/push/public-key",
      {
        method: "GET",
      },
    );

    console.log(
      "✅ VAPID public key received:",
      response.data.publicKey.substring(0, 20) + "...",
    );
    return response.data.publicKey;
  } catch (error) {
    console.error("❌ Failed to get VAPID public key:", error);
    throw error;
  }
};

// Register service worker
export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration> => {
    if (!isPushSupported()) {
      throw new Error("Service Worker is not supported");
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  };

// Subscribe to push notifications
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    console.log("🔔 Starting push subscription process...");

    // Request permission first
    console.log("1️⃣ Requesting notification permission...");
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }
    console.log("✅ Permission granted");

    // Register service worker
    console.log("2️⃣ Registering service worker...");
    const registration = await registerServiceWorker();
    console.log("✅ Service worker registered");

    // Get VAPID public key
    console.log("3️⃣ Fetching VAPID public key...");
    const vapidPublicKey = await getVapidPublicKey();

    // Convert VAPID key to ArrayBuffer
    console.log("4️⃣ Converting VAPID key to Uint8Array...");
    const vapidUint8Array = urlBase64ToUint8Array(vapidPublicKey);
    const applicationServerKey = vapidUint8Array.buffer;
    console.log("✅ VAPID key converted successfully");

    // Subscribe to push
    console.log("5️⃣ Subscribing to push manager...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log("✅ Push subscription created:", subscription);

    return subscription;
  } catch (error) {
    console.error("❌ Error subscribing to push:", error);
    throw error;
  }
};

// Send subscription to backend
export const sendSubscriptionToBackend = async (
  subscription: PushSubscription,
): Promise<void> => {
  try {
    console.log("📤 sendSubscriptionToBackend called", subscription.endpoint);
    const subscriptionData: WebPushSubscriptionRequest = {
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
      auth: arrayBufferToBase64(subscription.getKey("auth")!),
    };

    await apiClient<ApiResponse<string>>("/api/v1/push/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscriptionData),
    });

    console.log("✅ Subscription sent to backend successfully");
  } catch (error) {
    console.error("❌ Failed to send subscription to backend:", error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (): Promise<void> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Send unsubscribe request to backend
      await apiClient<ApiResponse<string>>("/api/v1/push/subscriptions", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      // Unsubscribe locally
      await subscription.unsubscribe();
      console.log("Successfully unsubscribed from push notifications");
    }
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    throw error;
  }
};

// Get current subscription
export const getCurrentSubscription =
  async (): Promise<PushSubscription | null> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error("Error getting current subscription:", error);
      return null;
    }
  };

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    console.log("🔄 Converting base64 VAPID key to Uint8Array...");
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    console.log("✅ VAPID key converted successfully");
    return outputArray;
  } catch (error) {
    console.error("❌ Error converting VAPID key:", error);
    console.error("❌ Base64 string was:", base64String);
    throw new Error("Invalid VAPID public key format");
  }
}

// Utility function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
