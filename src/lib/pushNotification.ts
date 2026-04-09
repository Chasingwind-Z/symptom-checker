const PUSH_PERMISSION_KEY = 'push_permission_asked';

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  // Only ask once per session
  if (sessionStorage.getItem(PUSH_PERMISSION_KEY)) return false;
  sessionStorage.setItem(PUSH_PERMISSION_KEY, 'true');

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendLocalNotification(title: string, body: string, url?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'health-assistant',
  });

  if (url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  }
}

export function scheduleFollowUpNotification(delayMs: number, title: string, body: string): void {
  // Use setTimeout for in-browser notification (works while tab is open)
  // For true background push, Edge Functions would be needed
  if (delayMs <= 0) return;

  window.setTimeout(() => {
    sendLocalNotification(title, body);
  }, Math.min(delayMs, 2147483647)); // max setTimeout value
}
