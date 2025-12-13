'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Star,
  Clock,
  Flame,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import {
  PublicMenuData,
  PublicMenuItem,
  CartItem,
  getColorTheme,
  getCurrencySymbol,
  getItemPrice,
  isItemAvailable,
  formatPrice,
} from './types';

interface ClassicMenuTemplateProps {
  menuData: PublicMenuData;
}

export function ClassicMenuTemplate({ menuData }: ClassicMenuTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(
    menuData.categories[0]?.id || 0
  );

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  const activeItems = useMemo(() => {
    const category = menuData.categories.find((cat) => cat.id === activeCategory);
    return category?.items || [];
  }, [menuData, activeCategory]);

  const activeCategoryData = menuData.categories.find((cat) => cat.id === activeCategory);

  const addToCart = (item: PublicMenuItem) => {
    if (!isItemAvailable(item, menuData.overrides)) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1, selectedVariation: null }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.item.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.item.id !== itemId);
    });
  };

  const getCartTotal = () => {
    return cart.reduce(
      (sum, cartItem) =>
        sum + getItemPrice(cartItem.item, menuData.overrides) * cartItem.quantity,
      0
    );
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartItem = (itemId: number) => {
    return cart.find((c) => c.item.id === itemId);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: design.bg }}>
      {/* Classic Header */}
      <header className="border-b" style={{ backgroundColor: design.card }}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-serif font-bold" style={{ color: design.text }}>
                {menuData.template.name}
              </h1>
              <p className="text-sm opacity-60 mt-1" style={{ color: design.text }}>
                {menuData.endpoint.name}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 rounded-lg border"
              style={{ borderColor: design.accent, color: design.accent }}
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span 
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: design.accent }}
                >
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="max-w-6xl mx-auto flex">
        {/* Category Sidebar */}
        <aside className="w-48 flex-shrink-0 border-r sticky top-0 h-screen overflow-y-auto" style={{ backgroundColor: design.card }}>
          <nav className="py-4">
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                  activeCategory === category.id ? 'border-l-4' : 'border-transparent'
                }`}
                style={{
                  backgroundColor: activeCategory === category.id ? design.accent + '15' : 'transparent',
                  borderLeftColor: activeCategory === category.id ? design.accent : 'transparent',
                  color: activeCategory === category.id ? design.accent : design.text,
                }}
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </div>
                <span className="text-xs opacity-50 mt-0.5 block">
                  {category.items.length} items
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Menu Content */}
        <main className="flex-1 p-6">
          {/* Category Header */}
          {activeCategoryData && (
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold" style={{ color: design.text }}>
                {activeCategoryData.icon && <span className="mr-2">{activeCategoryData.icon}</span>}
                {activeCategoryData.name}
              </h2>
              {activeCategoryData.description && (
                <p className="text-sm opacity-60 mt-1" style={{ color: design.text }}>
                  {activeCategoryData.description}
                </p>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            {activeItems.map((item) => {
              const available = isItemAvailable(item, menuData.overrides);
              const price = getItemPrice(item, menuData.overrides);
              const cartItem = getCartItem(item.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex gap-4 p-4 rounded-lg border ${!available ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: design.card, borderColor: design.bg }}
                >
                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold" style={{ color: design.text }}>
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {item.is_featured && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                          {item.is_spicy && (
                            <Flame className="w-4 h-4 text-red-500" />
                          )}
                          {item.dietary_info?.includes('vegetarian') && (
                            <Leaf className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: design.accent }}>
                          {symbol}{formatPrice(price)}
                        </span>
                        {item.compare_at_price && Number(item.compare_at_price) > price && (
                          <span className="block text-sm line-through opacity-40" style={{ color: design.text }}>
                            {symbol}{formatPrice(item.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm opacity-60 mt-2 leading-relaxed" style={{ color: design.text }}>
                        {item.description}
                      </p>
                    )}

                    {item.preparation_time && (
                      <div className="flex items-center gap-1 text-xs opacity-40 mt-2" style={{ color: design.text }}>
                        <Clock className="w-3 h-3" />
                        {item.preparation_time} min preparation
                      </div>
                    )}

                    {/* Add to Cart */}
                    <div className="mt-3">
                      {available ? (
                        cartItem ? (
                          <div className="inline-flex items-center gap-2 border rounded-lg px-2 py-1" style={{ borderColor: design.accent }}>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-100"
                              style={{ color: design.accent }}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-medium" style={{ color: design.text }}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-100"
                              style={{ color: design.accent }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border hover:shadow-sm transition-shadow"
                            style={{ borderColor: design.accent, color: design.accent }}
                          >
                            <Plus className="w-4 h-4" />
                            Add to Order
                          </button>
                        )
                      ) : (
                        <span className="text-sm opacity-50" style={{ color: design.text }}>
                          Currently Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Image */}
                  {item.image_url ? (
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    </div>
                  ) : item.icon ? (
                    <div className="flex-shrink-0 w-32 h-32 rounded-lg bg-neutral-100 flex items-center justify-center text-5xl">
                      {item.icon}
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Floating Cart Button */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-6 py-4 rounded-full text-white shadow-xl"
            style={{ backgroundColor: design.accent }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-medium">{getCartCount()} items</span>
            <span className="font-bold">{symbol}{formatPrice(getCartTotal())}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Cart Slide-out */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 flex flex-col"
              style={{ backgroundColor: design.card }}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold" style={{ color: design.text }}>Your Order</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="opacity-50" style={{ color: design.text }}>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((cartItem) => (
                      <div key={cartItem.item.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: design.bg }}>
                        {cartItem.item.image_url ? (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : cartItem.item.icon ? (
                          <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center text-2xl">
                            {cartItem.item.icon}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-neutral-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" style={{ color: design.text }}>
                            {cartItem.item.name}
                          </h3>
                          <p className="text-sm font-bold" style={{ color: design.accent }}>
                            {symbol}{formatPrice(getItemPrice(cartItem.item, menuData.overrides))}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(cartItem.item)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: design.accent }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t" style={{ backgroundColor: design.bg }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg" style={{ color: design.text }}>Subtotal</span>
                    <span className="text-2xl font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <button
                    className="w-full py-4 rounded-lg text-white font-medium"
                    style={{ backgroundColor: design.accent }}
                  >
                    Place Order
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
