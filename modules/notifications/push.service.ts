import { httpRequest } from '../core/http-client';

export interface PushNotificationPayload {
  type: 'message' | 'added_to_group' | string;
  title: string;
  body: string;
  groupId: string;
  groupName?: string;
  isDirect?: boolean;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  messageId?: string;
  url?: string;
  createdAt?: string;
}

const PUSH_MUTED_STORAGE_KEY = 'nexuspulse_push_muted';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  },

  getPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission;
  },

  isMuted(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(PUSH_MUTED_STORAGE_KEY) === 'true';
  },

  setMuted(muted: boolean): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PUSH_MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch {
      return null;
    }
  },

  async subscribeToWebPush(): Promise<boolean> {
    if (!this.isSupported()) return false;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      return false;
    }

    this.setMuted(false);

    try {
      const registration = await this.registerServiceWorker();
      if (!registration || !('pushManager' in registration)) {
        return true; // Fallback to standard Notification API remains active
      }

      const { publicKey } = await httpRequest<{ publicKey: string }>(
        '/api/user/push/vapid-public-key',
        { method: 'GET' }
      );

      if (!publicKey) return true;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
      }

      if (subscription) {
        await httpRequest('/api/user/push/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription.toJSON()),
        });
      }

      return true;
    } catch {
      // Standard browser Notification API still works even if PushManager fails
      return Notification.permission === 'granted';
    }
  },

  async unsubscribeFromWebPush(): Promise<void> {
    this.setMuted(true);
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await httpRequest('/api/user/push/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint }),
        });
      }
    } catch {
      // Ignore unsubscribe errors
    }
  },

  async syncIfGranted(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (this.isMuted()) return false;
    if (Notification.permission === 'granted') {
      return this.subscribeToWebPush();
    }
    return false;
  },

  playChime(): void {
    if (typeof window === 'undefined' || this.isMuted()) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 250);
    } catch {
      // Audio playback blocked by browser autoplay policy
    }
  },

  showNativeNotification(
    payload: PushNotificationPayload,
    onClickUrl?: (url: string) => void
  ): void {
    if (!this.isSupported() || this.isMuted()) return;
    if (Notification.permission !== 'granted') return;

    const targetUrl =
      payload.url || (payload.groupId ? `/channels/${payload.groupId}` : '/channels');

    try {
      const n = new Notification(payload.title || 'NexusPulse', {
        body: payload.body,
        tag: payload.groupId ? `channel-${payload.groupId}` : 'nexuspulse-msg',
      });

      n.onclick = () => {
        window.focus();
        n.close();
        if (onClickUrl) {
          onClickUrl(targetUrl);
        }
      };
    } catch {
      // Fallback to ServiceWorker registration notification
      navigator.serviceWorker?.ready
        .then((reg) =>
          reg.showNotification(payload.title || 'NexusPulse', {
            body: payload.body,
            tag: payload.groupId
              ? `channel-${payload.groupId}`
              : 'nexuspulse-msg',
            data: { url: targetUrl, groupId: payload.groupId },
          })
        )
        .catch(() => {});
    }
  },
};

