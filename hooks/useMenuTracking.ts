'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * useMenuTracking
 *
 * Fires behaviour events to POST {NEXT_PUBLIC_API_URL}/menu/{shortCode}/track
 * from the customer-facing menu. All calls are fire-and-forget; failures are
 * silently swallowed so they never disrupt the customer experience.
 *
 * Session token is auto-generated per shortCode via sessionStorage — all
 * components on the same menu page share the same session identifier.
 */

export interface TrackItemPayload {
  itemId: number;
  itemName: string;
  categoryName?: string;
  itemPrice?: number;
  viewDurationMs?: number;
}

export type RecSignalType = 'trending' | 'upsell' | 'pairing' | 'cart_gap' | 'guide';

export interface TrackRecPayload {
  itemId: number;
  itemName: string;
  categoryName?: string;
  itemPrice?: number;
  signalType: RecSignalType;
}

export function useMenuTracking(shortCode: string | null | undefined, externalSessionToken?: string | null) {
  // Auto-generate a persistent session token via sessionStorage so all tracking
  // calls from different components on the same menu page share one session ID.
  const [sessionToken] = useState<string>(() => {
    if (externalSessionToken) return externalSessionToken;
    if (typeof window === 'undefined' || !shortCode) return '';
    const key = `mv_track_${shortCode}`;
    let t = sessionStorage.getItem(key);
    if (!t) {
      t = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(key, t);
    }
    return t;
  });

  // Debounce view events — only fire once per item per 10 s window
  const viewCooldown = useRef<Record<number, number>>({});
  // De-duplicate rec_shown — fire at most once per item ID per component mount
  const shownCooldown = useRef<Set<number>>(new Set());

  const send = useCallback(
    (payload: Record<string, unknown>) => {
      if (!shortCode) return;
      const body = JSON.stringify({
        ...payload,
        session_token: sessionToken || undefined,
        device_type: detectDeviceType(),
      });
      // Target the backend API URL directly — not the Next.js server
      const base = process.env.NEXT_PUBLIC_API_URL ?? '';
      const url = `${base}/menu/${shortCode}/track`;
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
      }
    },
    [shortCode, sessionToken]
  );

  const trackView = useCallback(
    (item: TrackItemPayload) => {
      const now = Date.now();
      const last = viewCooldown.current[item.itemId] ?? 0;
      if (now - last < 10_000) return; // 10s cooldown per item
      viewCooldown.current[item.itemId] = now;

      send({
        event_type: 'view',
        item_id: item.itemId,
        item_name: item.itemName,
        category_name: item.categoryName,
        item_price: item.itemPrice,
        view_duration_ms: item.viewDurationMs,
      });
    },
    [send]
  );

  const trackCartAdd = useCallback(
    (item: TrackItemPayload) => {
      send({
        event_type: 'cart_add',
        item_id: item.itemId,
        item_name: item.itemName,
        category_name: item.categoryName,
        item_price: item.itemPrice,
      });
    },
    [send]
  );

  const trackCartRemove = useCallback(
    (item: Pick<TrackItemPayload, 'itemId' | 'itemName'>) => {
      send({
        event_type: 'cart_remove',
        item_id: item.itemId,
        item_name: item.itemName,
      });
    },
    [send]
  );

  const trackSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      send({ event_type: 'search', search_query: query.trim() });
    },
    [send]
  );

  /** Fire once per item ID per component mount (de-duplicated via shownCooldown). */
  const trackRecShown = useCallback(
    (item: TrackRecPayload) => {
      if (shownCooldown.current.has(item.itemId)) return;
      shownCooldown.current.add(item.itemId);
      send({
        event_type: 'rec_shown',
        item_id: item.itemId,
        item_name: item.itemName,
        category_name: item.categoryName,
        item_price: item.itemPrice,
        signal_type: item.signalType,
      });
    },
    [send]
  );

  /** Fire when a customer taps "Add" on a recommendation card. */
  const trackRecClicked = useCallback(
    (item: TrackRecPayload) => {
      send({
        event_type: 'rec_clicked',
        item_id: item.itemId,
        item_name: item.itemName,
        category_name: item.categoryName,
        item_price: item.itemPrice,
        signal_type: item.signalType,
      });
    },
    [send]
  );

  return { trackView, trackCartAdd, trackCartRemove, trackSearch, trackRecShown, trackRecClicked };
}

function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}
