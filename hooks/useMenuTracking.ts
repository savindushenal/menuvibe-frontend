'use client';

import { useCallback, useRef } from 'react';

/**
 * useMenuTracking
 *
 * Lightweight hook that fires behaviour events to POST /api/menu/{shortCode}/track
 * from the customer-facing menu. All calls are fire-and-forget; failures are
 * silently swallowed so they never disrupt the customer experience.
 *
 * Usage:
 *   const { trackView, trackCartAdd, trackCartRemove, trackSearch } = useMenuTracking(shortCode, sessionToken);
 *
 *   // When item modal opens or item is visible for 2+ seconds:
 *   trackView({ itemId: 12, itemName: 'Grilled Prawns', categoryName: 'Mains', itemPrice: 450 });
 *
 *   // When user taps "Add to Cart":
 *   trackCartAdd({ itemId: 12, itemName: 'Grilled Prawns', categoryName: 'Mains', itemPrice: 450 });
 *
 *   // When user removes from cart:
 *   trackCartRemove({ itemId: 12, itemName: 'Grilled Prawns' });
 *
 *   // When user searches:
 *   trackSearch('prawn');
 */

export interface TrackItemPayload {
  itemId: number;
  itemName: string;
  categoryName?: string;
  itemPrice?: number;
  viewDurationMs?: number;
}

export function useMenuTracking(shortCode: string | null | undefined, sessionToken?: string | null) {
  // Debounce view events — only fire once per item per 10s window
  const viewCooldown = useRef<Record<number, number>>({});

  const send = useCallback(
    (payload: Record<string, unknown>) => {
      if (!shortCode) return;
      // Best-effort fire-and-forget using sendBeacon when available
      const body = JSON.stringify({
        ...payload,
        session_token: sessionToken ?? undefined,
        device_type: detectDeviceType(),
      });
      const url = `/api/menu/${shortCode}/track`;
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

  return { trackView, trackCartAdd, trackCartRemove, trackSearch };
}

function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}
