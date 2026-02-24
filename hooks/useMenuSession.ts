'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDeviceId } from '@/lib/deviceId';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.menuvire.com/api')
  .replace(/\/api\/?$/, '') + '/api';

// Cookie helpers — more persistent than localStorage across browser sessions
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export interface OrderSummary {
  id: number;
  order_number: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  items: OrderLineItem[];
  total: number | string;
  currency: string;
  table_identifier: string | null;
  notes: string | null;
  is_active: boolean;
  placed_at: string;
  preparing_at?: string | null;
  ready_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderLineItem {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  selectedVariation?: { name: string; price: number } | null;
}

export function useMenuSession(shortCode: string) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const storageKey = `mvsession_${shortCode}`;

  const pollStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/menu-session/${token}/status`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        const all: OrderSummary[] = [
          ...(data.data.active_orders ?? []),
          ...(data.data.done_orders ?? []),
        ];
        setOrders(all);
      }
    } catch {}
  }, []);

  // Init / restore session on mount
  useEffect(() => {
    if (!shortCode || typeof window === 'undefined') return;
    const stored = getCookie(storageKey);
    const deviceId = getDeviceId();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/menu-session/${shortCode}/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: stored, device_id: deviceId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const tok: string = data.data.session_token;
          setSessionToken(tok);
          tokenRef.current = tok;
          setCookie(storageKey, tok, 7);
          const all: OrderSummary[] = [
            ...(data.data.active_orders ?? []),
            ...(data.data.recent_orders ?? []),
          ];
          setOrders(all);
        }
      } catch {}
    })();
  }, [shortCode, storageKey]);

  // Auto-poll every 5 s while active orders exist
  useEffect(() => {
    const tok = sessionToken;
    if (!tok) return;
    const hasActive = orders.some((o) => o.is_active);
    if (!hasActive) return;
    const iv = setInterval(() => pollStatus(tok), 5000);
    return () => clearInterval(iv);
  }, [orders, sessionToken, pollStatus]);

  const placeOrder = useCallback(
    async (
      items: OrderLineItem[],
      currency = 'LKR',
      notes = '',
    ): Promise<OrderSummary | null> => {
      const tok = sessionToken ?? tokenRef.current;
      if (!tok || items.length === 0) return null;
      setIsPlacingOrder(true);
      setOrderError(null);
      try {
        const res = await fetch(`${API_BASE}/menu-session/${tok}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, currency, notes }),
        });
        const data = await res.json();
        if (data.success) {
          setOrders((prev) => [data.data as OrderSummary, ...prev]);
          return data.data as OrderSummary;
        }
        setOrderError(data.message ?? 'Failed to place order');
      } catch {
        setOrderError('Connection error. Please try again.');
      } finally {
        setIsPlacingOrder(false);
      }
      return null;
    },
    [sessionToken],
  );

  return { sessionToken, orders, isPlacingOrder, orderError, placeOrder };
}
