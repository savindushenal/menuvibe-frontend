'use client';

/**
 * CartUpsellStrip
 *
 * A horizontal scrollable strip rendered inside the cart drawer.
 * Shows items from categories NOT yet in the cart — "complete your meal" logic.
 *
 * It also surfaces upsells when a single category dominates the cart:
 * e.g., 3 mains but no drink → "Add a drink to complete your order"
 *
 * Usage:  drop this inside the cart drawer, above the checkout button.
 * It renders nothing if there are no meaningful suggestions.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import type { PublicMenuData } from '@/app/m/[code]/templates/types';
import { getCurrencySymbol, formatPrice, getColorTheme, isItemAvailable } from '@/app/m/[code]/templates/types';
import type { RecommendedItem } from '@/hooks/useRecommendations';

// ── Types ─────────────────────────────────────────────────────────────────── //

interface CartItem {
  item: { id: number };
  quantity: number;
}

interface CartUpsellStripProps {
  menuData: PublicMenuData;
  cart: CartItem[];
  /** Server-provided gap suggestions (from useRecommendations hook) */
  cartGaps?: RecommendedItem[];
  /** Called when customer taps add on a suggestion */
  onAdd: (item: RecommendedItem) => void;
}

// ── Helper: build label for the strip ─────────────────────────────────────── //

function getStripLabel(cart: CartItem[], menuData: PublicMenuData): string {
  const cartItemIds = cart.map(c => c.item.id);
  const allItems = menuData.categories.flatMap(c => c.items.map(i => ({ ...i, category_name: c.name })));
  const cartItems = allItems.filter(i => cartItemIds.includes(i.id));

  const drinkKeywords = ['drink', 'beverage', 'juice', 'coffee', 'tea', 'cocktail', 'soda', 'water', 'smoothie'];
  const hasDrink = cartItems.some(i =>
    drinkKeywords.some(kw => i.category_name.toLowerCase().includes(kw))
  );

  const dessertKeywords = ['dessert', 'sweet', 'cake', 'ice cream', 'waffle', 'pudding'];
  const hasDessert = cartItems.some(i =>
    dessertKeywords.some(kw => i.category_name.toLowerCase().includes(kw))
  );

  if (!hasDrink) return 'Add a drink to complete your meal 🥤';
  if (!hasDessert) return 'Finish with something sweet? 🍰';
  return 'People also added these 🍽️';
}

// ── Component ─────────────────────────────────────────────────────────────── //

export default function CartUpsellStrip({
  menuData,
  cart,
  cartGaps = [],
  onAdd,
}: CartUpsellStripProps) {
  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  // Track recently-added item IDs — keeps the card visible for 1.5 s so the ✓ feedback is seen
  const [lockedItemIds, setLockedItemIds] = useState<Set<number>>(new Set());

  const handleItemAdd = useCallback((item: RecommendedItem) => {
    setLockedItemIds(prev => new Set([...prev, item.id]));
    setTimeout(() => {
      setLockedItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
    onAdd(item);
  }, [onAdd]);

  const cartItemIds = cart.map(c => c.item.id);
  const cartCategoryIds = useMemo(() => {
    const all = menuData.categories.flatMap(cat => cat.items.map(i => ({ id: i.id, catId: cat.id })));
    return all.filter(i => cartItemIds.includes(i.id)).map(i => i.catId);
  }, [cart, menuData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Full catalogue of available items (used to restore locked cards after they leave suggestions)
  const allAvailableItems = useMemo<RecommendedItem[]>(() =>
    menuData.categories.flatMap(cat =>
      cat.items
        .filter(i => isItemAvailable(i, menuData.overrides))
        .map(i => ({ ...i, category_id: cat.id, category_name: cat.name } as RecommendedItem))
    ),
  [menuData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge server gaps with a local fallback
  const suggestions = useMemo(() => {
    if (cartGaps.length > 0) return cartGaps.slice(0, 5);

    // Local fallback: items from categories not in cart
    return menuData.categories
      .filter(cat => !cartCategoryIds.includes(cat.id))
      .flatMap(cat =>
        cat.items
          .filter(i => isItemAvailable(i, menuData.overrides) && !cartItemIds.includes(i.id))
          .slice(0, 2)
          .map(i => ({ ...i, category_id: cat.id, category_name: cat.name }) as RecommendedItem)
      )
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
      .slice(0, 5);
  }, [cartGaps, cart, menuData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Display list = active suggestions PLUS any locked items that just left the list
  const displaySuggestions = useMemo(() => {
    const suggestionIds = new Set(suggestions.map(i => i.id));
    const locked = allAvailableItems.filter(i => lockedItemIds.has(i.id) && !suggestionIds.has(i.id));
    return [...suggestions, ...locked].slice(0, 6);
  }, [suggestions, lockedItemIds, allAvailableItems]);

  if (cart.length === 0 || displaySuggestions.length === 0) return null;

  const label = getStripLabel(cart, menuData);

  return (
    <AnimatePresence>
      <motion.div
        key="upsell-strip"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-t"
        style={{ borderColor: design.bg, backgroundColor: design.card }}
      >
        {/* Label */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: design.accent }} />
          <p className="text-xs font-medium opacity-70" style={{ color: design.text }}>
            {label}
          </p>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-4 no-scrollbar">
          {displaySuggestions.map(item => (
            <UpsellCard
              key={item.id}
              item={item}
              symbol={symbol}
              design={design}
              isAdded={lockedItemIds.has(item.id)}
              onAdd={() => handleItemAdd(item)}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Card sub-component ─────────────────────────────────────────────────────── //

interface UpsellCardProps {
  item: RecommendedItem;
  symbol: string;
  design: { bg: string; text: string; accent: string; card: string };
  onAdd: () => void;
  /** Externally controlled — true while the parent is keeping this card locked (1.5 s after add) */
  isAdded?: boolean;
}

function UpsellCard({ item, symbol, design, onAdd, isAdded: isAddedProp = false }: UpsellCardProps) {
  const [added, setAdded] = React.useState(false);
  const showAdded = added || isAddedProp;

  const handleAdd = () => {
    setAdded(true);
    onAdd();
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-32 rounded-xl overflow-hidden"
      style={{ backgroundColor: design.bg }}
    >
      {/* Image */}
      <div className="w-full h-20 bg-neutral-200 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">{item.icon || '🍽️'}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: design.text }}>
          {item.name}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-bold" style={{ color: design.accent }}>
            {symbol}{formatPrice(Number(item.price))}
          </span>
          <button
            onClick={handleAdd}
            disabled={showAdded}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: showAdded ? '#10b981' : design.accent }}
          >
            {showAdded ? <span className="text-xs">✓</span> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
