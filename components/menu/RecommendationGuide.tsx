'use client';

/**
 * RecommendationGuide
 *
 * A zero-force, opt-in discovery assistant for the customer menu.
 *
 * Behaviour:
 * - Renders a single small floating button: "Not sure what to get? 👋"
 * - Button appears after IDLE_DELAY_MS of no interaction (customer is lost)
 * - On tap → shows a quick-filter panel (3-second UX max; no typing)
 * - Customer picks a mood → 2–6 item cards → one-tap add to cart
 * - Dismisses cleanly; never appears again in this session if customer ordered
 *
 * Feature flags (from platform_settings):
 *   recommendation_guide_enabled  – if false, nothing renders at all
 *   mascot_assistant_enabled      – if true, shows the mascot character avatar
 *                                   alongside the panel header (future layer)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import type { PublicMenuData } from '@/app/m/[code]/templates/types';
import { getCurrencySymbol, formatPrice, getColorTheme, isItemAvailable } from '@/app/m/[code]/templates/types';
import {
  useRecommendationGuide,
  useRecommendationFeatureFlags,
  type GuideMood,
  type RecommendedItem,
} from '@/hooks/useRecommendations';

// ── Types ─────────────────────────────────────────────────────────────────── //

interface RecommendationGuideProps {
  shortCode: string;
  menuData: PublicMenuData;
  /** Called when customer taps "Add" on a guide result item */
  onAddToCart: (item: RecommendedItem) => void;
  /** Whether an order has been placed this session (hides the guide) */
  hasOrdered?: boolean;
  /** Optional bottom offset in px (to clear floating cart bar) */
  bottomOffset?: number;
  /** Which side of the screen the trigger button sits on */
  side?: 'left' | 'right';
}

// ── Mood config ───────────────────────────────────────────────────────────── //

const MOODS: { id: GuideMood; label: string; emoji: string }[] = [
  { id: 'spicy',   label: 'Something spicy',  emoji: '🌶️' },
  { id: 'hearty',  label: 'Hearty & filling', emoji: '🍖' },
  { id: 'light',   label: 'Light meal',        emoji: '🥗' },
  { id: 'drink',   label: 'Just a drink',      emoji: '☕' },
  { id: 'dessert', label: 'Dessert',            emoji: '🍰' },
  { id: 'surprise',label: 'Surprise me!',      emoji: '😮' },
];

// Time of idle before the button appears (10 seconds)
const IDLE_DELAY_MS = 10_000;

// ── Component ─────────────────────────────────────────────────────────────── //

export default function RecommendationGuide({
  shortCode,
  menuData,
  onAddToCart,
  hasOrdered = false,
  bottomOffset = 72,
  side = 'left',
}: RecommendationGuideProps) {
  const flags = useRecommendationFeatureFlags();
  const { results, mood, loading, fetchGuide, reset } = useRecommendationGuide(shortCode);

  const [isVisible, setIsVisible]     = useState(false); // button visible
  const [isPanelOpen, setIsPanelOpen] = useState(false); // full panel open
  const [addedIds, setAddedIds]       = useState<Set<number>>(new Set());
  const idleTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownRef                   = useRef(false);

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  // ── Show button after idle ─────────────────────────────────────────────── //

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (hasShownRef.current || hasOrdered || !flags.recommendationGuideEnabled) return;

    idleTimerRef.current = setTimeout(() => {
      setIsVisible(true);
      hasShownRef.current = true;
    }, IDLE_DELAY_MS);
  }, [hasOrdered, flags.recommendationGuideEnabled]);

  useEffect(() => {
    const events = ['touchstart', 'mousemove', 'scroll', 'keydown'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // start timer on mount

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Hide everything once customer has ordered
  useEffect(() => {
    if (hasOrdered) {
      setIsVisible(false);
      setIsPanelOpen(false);
    }
  }, [hasOrdered]);

  if (!flags.recommendationGuideEnabled) return null;

  // ── Handlers ──────────────────────────────────────────────────────────── //

  const handleOpenPanel = () => setIsPanelOpen(true);

  const handleMoodSelect = (m: GuideMood) => {
    fetchGuide(m, menuData);
  };

  const handleAdd = (item: RecommendedItem) => {
    onAddToCart(item);
    setAddedIds(prev => new Set(prev).add(item.id));
    // If item needs variation selection the modal takes over — close the guide to prevent overlap
    if (item.variations && item.variations.length > 0) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    reset();
  };

  // ── Render ────────────────────────────────────────────────────────────── //

  return (
    <>
      {/* ── Floating trigger button ── */}
      <AnimatePresence>
        {isVisible && !isPanelOpen && (
          <motion.button
            key="guide-btn"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={handleOpenPanel}
            className="fixed z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
            style={{
              bottom: bottomOffset,
              [side]: '1rem',
              backgroundColor: design.card,
              color: design.text,
              border: `1.5px solid ${design.accent}22`,
              boxShadow: `0 4px 20px ${design.accent}25`,
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: design.accent }} />
            <span>Not sure what to get?</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Overlay ── */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            key="guide-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* ── Panel (bottom sheet) ── */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            key="guide-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: design.card }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: design.bg }}>
              <div className="flex items-center gap-2">
                {/* Mascot avatar slot — only shown when mascot_assistant_enabled = true */}
                {flags.mascotAssistantEnabled && (
                  <span className="text-2xl select-none" aria-hidden>🍽️</span>
                )}
                <div>
                  <h3 className="font-bold text-base" style={{ color: design.text }}>
                    What are you in the mood for?
                  </h3>
                  <p className="text-xs opacity-60" style={{ color: design.text }}>
                    Pick one and I'll find the best options for you
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full"
                style={{ backgroundColor: design.bg }}
              >
                <X className="w-4 h-4" style={{ color: design.text }} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pb-6">
              {/* ── Mood picker (always visible after open) ── */}
              {!mood && (
                <motion.div
                  key="moods"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-3 p-5"
                >
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleMoodSelect(m.id)}
                      className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-transform active:scale-95"
                      style={{ backgroundColor: design.bg }}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-sm font-medium" style={{ color: design.text }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* ── Loading state ── */}
              {mood && loading && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: design.accent }}
                  />
                  <p className="text-sm opacity-60" style={{ color: design.text }}>Finding the best options…</p>
                </div>
              )}

              {/* ── Results ── */}
              {mood && !loading && results.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Back button */}
                  <button
                    onClick={reset}
                    className="flex items-center gap-1 px-5 pt-4 pb-2 text-xs font-medium opacity-60"
                    style={{ color: design.text }}
                  >
                    ← Try another mood
                  </button>

                  <p className="px-5 pb-3 text-sm font-semibold" style={{ color: design.text }}>
                    {results.length} picks for you
                  </p>

                  <div className="flex flex-col gap-2 px-4">
                    {results.map(item => {
                      const added = addedIds.has(item.id);
                      const available = isItemAvailable(item, menuData.overrides);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ backgroundColor: design.bg }}
                        >
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-200 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{item.icon || '🍽️'}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: design.text }}>{item.name}</p>
                            {item.category_name && (
                              <p className="text-xs opacity-50 truncate" style={{ color: design.text }}>{item.category_name}</p>
                            )}
                            <p className="text-sm font-bold mt-0.5" style={{ color: design.accent }}>
                              {symbol}{formatPrice(Number(item.price))}
                            </p>
                          </div>

                          {/* Add button */}
                          <button
                            disabled={!available || added}
                            onClick={() => handleAdd(item)}
                            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all disabled:opacity-50"
                            style={{
                              backgroundColor: added ? '#10b981' : design.accent,
                            }}
                          >
                            {added ? '✓ Added' : '+ Add'}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Continue browsing CTA */}
                  <div className="px-5 pt-4">
                    <button
                      onClick={handleClose}
                      className="w-full py-3 rounded-xl text-sm font-medium border"
                      style={{ color: design.text, borderColor: design.accent + '40' }}
                    >
                      Browse full menu
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Empty state ── */}
              {mood && !loading && results.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 px-8 text-center">
                  <span className="text-4xl">😔</span>
                  <p className="font-medium" style={{ color: design.text }}>No matches found</p>
                  <p className="text-sm opacity-60" style={{ color: design.text }}>
                    Try a different mood or browse the full menu
                  </p>
                  <button onClick={reset} className="mt-2 text-sm font-semibold" style={{ color: design.accent }}>
                    ← Try another mood
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
