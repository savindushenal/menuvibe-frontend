'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Star,
  Flame,
  Leaf,
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

interface MinimalMenuTemplateProps {
  menuData: PublicMenuData;
}

export function MinimalMenuTemplate({ menuData }: MinimalMenuTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    menuData.categories[0]?.name || 'All'
  );

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  // Get all items for the active category
  const activeItems = useMemo(() => {
    if (activeCategory === 'All') {
      return menuData.categories.flatMap((cat) => cat.items);
    }
    const category = menuData.categories.find((cat) => cat.name === activeCategory);
    return category?.items || [];
  }, [menuData, activeCategory]);

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
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ backgroundColor: design.bg + 'ee' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: design.text }}>
                {menuData.template.name}
              </h1>
              <p className="text-sm opacity-60" style={{ color: design.text }}>
                {menuData.endpoint.name}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 rounded-full"
              style={{ backgroundColor: design.card, color: design.text }}
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                  style={{ backgroundColor: design.accent }}
                >
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <nav className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide">
          {menuData.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all`}
              style={
                activeCategory === category.name
                  ? { backgroundColor: design.accent, color: 'white' }
                  : { backgroundColor: design.card, color: design.text }
              }
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Grid Menu */}
      <main className="max-w-3xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-2 gap-4">
          {activeItems.map((item) => {
            const available = isItemAvailable(item, menuData.overrides);
            const price = getItemPrice(item, menuData.overrides);
            const cartItem = getCartItem(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl overflow-hidden shadow-sm ${!available ? 'opacity-50' : ''}`}
                style={{ backgroundColor: design.card }}
              >
                {/* Image */}
                <div className="relative aspect-square">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.is_featured && (
                      <span className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </span>
                    )}
                    {item.is_spicy && (
                      <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <Flame className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {item.dietary_info?.includes('vegetarian') && (
                      <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button */}
                  {available && (
                    <div className="absolute bottom-2 right-2">
                      {cartItem ? (
                        <div 
                          className="flex items-center gap-1 rounded-full px-2 py-1"
                          style={{ backgroundColor: design.accent }}
                        >
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-white text-sm font-medium">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg"
                          style={{ backgroundColor: design.accent }}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1" style={{ color: design.text }}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs opacity-50 line-clamp-1 mt-0.5" style={{ color: design.text }}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(price)}
                    </span>
                    {item.compare_at_price && Number(item.compare_at_price) > price && (
                      <span className="text-xs line-through opacity-40" style={{ color: design.text }}>
                        {symbol}{formatPrice(item.compare_at_price)}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Bottom Sheet Cart Button */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ backgroundColor: design.bg }}>
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full py-4 px-6 rounded-2xl flex items-center justify-between text-white shadow-xl"
              style={{ backgroundColor: design.accent }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-medium">{getCartCount()} items</span>
              </div>
              <span className="font-bold">{symbol}{formatPrice(getCartTotal())}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Bottom Sheet */}
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
              style={{ backgroundColor: design.card }}
            >
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mt-3" />
              
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: design.text }}>Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[45vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="opacity-50" style={{ color: design.text }}>Empty cart</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((cartItem) => (
                      <div 
                        key={cartItem.item.id} 
                        className="flex items-center gap-3 p-2 rounded-xl"
                        style={{ backgroundColor: design.bg }}
                      >
                        {cartItem.item.image_url ? (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-neutral-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate" style={{ color: design.text }}>
                            {cartItem.item.name}
                          </h3>
                          <p className="text-sm font-bold" style={{ color: design.accent }}>
                            {symbol}{formatPrice(getItemPrice(cartItem.item, menuData.overrides))}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart(cartItem.item)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: design.accent }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ color: design.text }}>Total</span>
                    <span className="text-xl font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <button
                    className="w-full py-4 rounded-xl text-white font-medium"
                    style={{ backgroundColor: design.accent }}
                  >
                    Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
