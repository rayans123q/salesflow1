// Push Notification Service
// Manages browser push notifications

import { supabase } from './supabaseClient';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LY'; // Replace with your actual VAPID public key

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }

      // Save subscription to database
      await this.savePushSubscription(subscription);

      return subscription.toJSON() as PushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removePushSubscription(subscription);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Check if currently subscribed
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      return false;
    }
  }

  // Save push subscription to database
  private async savePushSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const subscriptionData = subscription.toJSON();

    const { error } = await supabase
      .from('push_notification_tokens')
      .upsert({
        user_id: user.user.id,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys?.p256dh,
        auth_key: subscriptionData.keys?.auth,
        user_agent: navigator.userAgent,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      });

    if (error) throw error;
  }

  // Remove push subscription from database
  private async removePushSubscription(subscription: globalThis.PushSubscription): Promise<void> {
    const subscriptionData = subscription.toJSON();

    const { error } = await supabase
      .from('push_notification_tokens')
      .update({ is_active: false })
      .eq('endpoint', subscriptionData.endpoint);

    if (error) throw error;
  }

  // Test push notification
  async sendTestNotification(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = this.getPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Show a local notification (doesn't require server)
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Test Notification', {
      body: 'Push notifications are working! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'test-notification',
      requireInteraction: false
    });
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
