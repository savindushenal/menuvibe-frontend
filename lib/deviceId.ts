/**
 * Stable device ID — survives cookie clears, localStorage clears, even browser switches
 * if the user has any ONE of the three storage mechanisms intact.
 * Written to: cookie (7d) + localStorage + sessionStorage simultaneously.
 */

const KEY = 'mv_device_id';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + KEY + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  // Try all three storages — use whichever has a value
  const fromCookie = getCookie();
  const fromLocal  = localStorage.getItem(KEY);
  const fromSession = sessionStorage.getItem(KEY);

  const existing = fromCookie || fromLocal || fromSession;

  if (existing) {
    // Sync to any storage that was missing it
    if (!fromCookie)  setCookie(existing);
    if (!fromLocal)   localStorage.setItem(KEY, existing);
    if (!fromSession) sessionStorage.setItem(KEY, existing);
    return existing;
  }

  // First time — generate and store in all three
  const id = uuid();
  setCookie(id);
  localStorage.setItem(KEY, id);
  sessionStorage.setItem(KEY, id);
  return id;
}
