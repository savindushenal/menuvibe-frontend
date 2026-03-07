'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicMenuItem, PublicMenuData } from '@/app/m/[code]/templates/types';
import { isItemAvailable } from '@/app/m/[code]/templates/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── Types ──────────────────────────────────────────────────────────────────── //

export interface RecommendedItem extends PublicMenuItem {
  category_id: number;
  category_name: string;
  order_count?: number;
  price_diff?: number;
}

export interface RecommendationData {
  trending: RecommendedItem[];
  pairings: RecommendedItem[];
  cart_gaps: RecommendedItem[];
  upsells: RecommendedItem[];
}

export type GuideMood = 'spicy' | 'light' | 'hearty' | 'drink' | 'dessert' | 'surprise';

export interface GuideResult {
  mood: GuideMood;
  items: RecommendedItem[];
}

// ── Main hook ─────────────────────────────────────────────────────────────── //

interface UseRecommendationsOptions {
  shortCode: string;
  menuData: PublicMenuData;
  focusedItemId?: number | null;
  cartItemIds?: number[];
  enabled?: boolean;
}

export function useRecommendations({
  shortCode,
  menuData,
  focusedItemId,
  cartItemIds = [],
  enabled = true,
}: UseRecommendationsOptions) {
  const [data, setData] = useState<RecommendationData>({
    trending: [],
    pairings: [],
    cart_gaps: [],
    upsells: [],
  });
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<string>('');

  const fetchRecommendations = useCallback(async () => {
    if (!enabled || !shortCode) return;

    const key = `${focusedItemId ?? 0}|${cartItemIds.sort().join(',')}`;
    if (key === lastFetchRef.current) return; // skip redundant fetch
    lastFetchRef.current = key;

    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '5' });
      if (focusedItemId) params.set('item_id', String(focusedItemId));
      if (cartItemIds.length > 0) params.set('cart_item_ids', cartItemIds.join(','));

      const res = await fetch(`${API_BASE}/menu/${shortCode}/recommendations?${params}`);
      if (!res.ok) throw new Error('fetch failed');

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        return;
      }
    } catch {
      // Network failure → fall through to local fallback
    } finally {
      setLoading(false);
    }

    // ── Local fallback (works with zero order history) ─────────────────── //
    setData(buildLocalRecommendations(menuData, focusedItemId, cartItemIds));
  }, [enabled, shortCode, focusedItemId, cartItemIds.join(','), menuData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { data, loading, refetch: fetchRecommendations };
}

// ── Guide hook (for "Not sure what to get?" flow) ─────────────────────────── //

export function useRecommendationGuide(shortCode: string) {
  const [results, setResults] = useState<RecommendedItem[]>([]);
  const [mood, setMood] = useState<GuideMood | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGuide = useCallback(async (selectedMood: GuideMood, menuData?: PublicMenuData) => {
    setMood(selectedMood);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/menu/${shortCode}/recommendations/guide?mood=${selectedMood}&limit=6`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      if (json.success && json.data?.items?.length > 0) {
        setResults(json.data.items);
        return;
      }
      // Backend returned success but empty items — fall through to local fallback
    } catch {
      // fallback to local if backend unreachable
    } finally {
      setLoading(false);
    }

    // Local fallback
    if (menuData) {
      setResults(buildGuideLocalFallback(selectedMood, menuData));
    }
  }, [shortCode]);

  return { results, mood, loading, fetchGuide, reset: () => { setResults([]); setMood(null); } };
}

// ── Feature flag hook ─────────────────────────────────────────────────────── //

interface FeatureFlags {
  recommendationGuideEnabled: boolean;
  mascotAssistantEnabled: boolean;
}

const flagCache: Record<string, { flags: FeatureFlags; at: number }> = {};

export function useRecommendationFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>({
    recommendationGuideEnabled: true,  // optimistic default
    mascotAssistantEnabled: false,
  });

  useEffect(() => {
    const cached = flagCache['flags'];
    if (cached && Date.now() - cached.at < 300_000) {
      setFlags(cached.flags);
      return;
    }

    fetch(`${API_BASE}/platform/settings`)
      .then(r => r.json())
      .then(json => {
        // Platform settings returns an array of { key, value } objects
        const list: Array<{ key: string; value: string }> = Array.isArray(json.data) ? json.data : [];
        const find = (key: string, def: boolean) => {
          const s = list.find(s => s.key === key);
          if (!s) return def;
          return s.value === 'true' || s.value === '1';
        };

        const resolved: FeatureFlags = {
          recommendationGuideEnabled: find('recommendation_guide_enabled', true),
          mascotAssistantEnabled: find('mascot_assistant_enabled', false),
        };

        flagCache['flags'] = { flags: resolved, at: Date.now() };
        setFlags(resolved);
      })
      .catch(() => {
        // keep optimistic defaults
      });
  }, []);

  return flags;
}

// ── Local fallback logic ───────────────────────────────────────────────────── //

function buildLocalRecommendations(
  menuData: PublicMenuData,
  focusedItemId?: number | null,
  cartItemIds: number[] = []
): RecommendationData {
  const allItems = menuData.categories.flatMap(cat =>
    cat.items.map(item => ({
      ...item,
      category_id: cat.id,
      category_name: cat.name,
    }))
  ) as RecommendedItem[];

  const available = allItems.filter(item => isItemAvailable(item, menuData.overrides));
  const cartCatIds = available.filter(i => cartItemIds.includes(i.id)).map(i => i.category_id);

  const trending = available
    .filter(i => i.is_featured && !cartItemIds.includes(i.id))
    .slice(0, 5);

  const pairings = focusedItemId
    ? (() => {
        const focused = available.find(i => i.id === focusedItemId);
        if (!focused) return [];
        return available
          .filter(i => i.id !== focusedItemId && i.category_id !== focused.category_id && !cartItemIds.includes(i.id))
          .slice(0, 4);
      })()
    : [];

  const cart_gaps = cartItemIds.length > 0
    ? available
        .filter(i => !cartItemIds.includes(i.id) && !cartCatIds.includes(i.category_id))
        .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
        .slice(0, 5)
    : [];

  const upsells = focusedItemId
    ? (() => {
        const focused = available.find(i => i.id === focusedItemId);
        if (!focused) return [];
        return available
          .filter(i =>
            i.id !== focusedItemId &&
            i.category_id === focused.category_id &&
            Number(i.price) > Number(focused.price)
          )
          .slice(0, 3);
      })()
    : [];

  return { trending, pairings, cart_gaps, upsells };
}

const MOOD_KEYWORDS: Record<GuideMood, string[]> = {
  spicy:   ['spicy', 'hot', 'chilli', 'pepper', 'curry', 'spice'],
  light:   ['salad', 'soup', 'light', 'appetizer', 'starter', 'juice', 'smoothie'],
  hearty:  ['main', 'grill', 'burger', 'rice', 'pasta', 'steak', 'platter', 'seafood'],
  drink:   ['drink', 'beverage', 'juice', 'smoothie', 'coffee', 'tea', 'cocktail', 'soda', 'water'],
  dessert: ['dessert', 'sweet', 'cake', 'ice cream', 'pudding', 'waffle', 'pastry'],
  surprise: [],
};

function buildGuideLocalFallback(mood: GuideMood, menuData: PublicMenuData): RecommendedItem[] {
  const allItems = menuData.categories.flatMap(cat =>
    cat.items.map(item => ({ ...item, category_id: cat.id, category_name: cat.name }))
  ) as RecommendedItem[];

  const available = allItems.filter(item => isItemAvailable(item, menuData.overrides));

  if (mood === 'surprise') {
    const featured = available.filter(i => i.is_featured);
    return (featured.length >= 3 ? featured : available).slice(0, 6);
  }

  if (mood === 'spicy') {
    const spicy = available.filter(i => i.is_spicy || (i.spice_level ?? 0) > 0);
    return spicy.length > 0 ? spicy.slice(0, 6) : available.filter(i => i.is_featured).slice(0, 6);
  }

  const keywords = MOOD_KEYWORDS[mood];
  const matched = available.filter(item => {
    // Build a rich haystack: category + name + description + dietary labels + allergens
    // so "grilled salmon with garlic butter" matches 'hearty' even if category is just "Specials"
    const haystack = [
      item.category_name,
      item.name,
      item.description,
      ...(Array.isArray(item.dietary_info) ? item.dietary_info : []),
      ...(Array.isArray(item.allergens)    ? item.allergens    : []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return keywords.some(kw => haystack.includes(kw));
  });

  return matched.length > 0 ? matched.slice(0, 6) : available.filter(i => i.is_featured).slice(0, 6);
}
