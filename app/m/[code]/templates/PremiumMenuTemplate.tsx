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
  MapPin,
  Tag,
  Phone,
  Globe,
  UtensilsCrossed,
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

// Default food icon for items without image or icon
const DEFAULT_ITEM_ICON = '🍽️';
const DEFAULT_CATEGORY_ICON = '📋';

interface PremiumMenuTemplateProps {
  menuData: PublicMenuData;
}

export function PremiumMenuTemplate({ menuData }: PremiumMenuTemplateProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    menuData.categories[0]?.name || 'All'
  );
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);

  const design = getColorTheme(menuData.template.settings);
  const symbol = getCurrencySymbol(menuData.template.currency);

  // Get greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 17) return 'Good Afternoon! 🌤️';
    return 'Good Evening! 🌙';
  }, []);

  // Get featured/top picks items
  const topPicks = useMemo(() => {
    const featured = menuData.categories
      .flatMap((cat) => cat.items)
      .filter((item) => item.is_featured && isItemAvailable(item, menuData.overrides));
    return featured.slice(0, 6);
  }, [menuData]);

  // Get all items for the active category
  const activeItems = useMemo(() => {
    if (activeCategory === 'All') {
      return menuData.categories.flatMap((cat) => cat.items);
    }
    const category = menuData.categories.find((cat) => cat.name === activeCategory);
    return category?.items || [];
  }, [menuData, activeCategory]);

  // Stats
  const totalItems = menuData.categories.reduce((sum, cat) => sum + cat.items.length, 0);

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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: design.bg }}>
      {/* Hero Header with Business Info */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${design.accent} 0%, ${design.bg} 100%)` 
          }}
        />
        <div className="relative max-w-lg mx-auto px-3 sm:px-4 md:px-6 pt-6 sm:pt-7 md:pt-8 pb-4 sm:pb-5 md:pb-6">
          {/* Logo & Cart */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {menuData.business?.logo_url || menuData.template.image_url ? (
                <img 
                  src={menuData.business?.logo_url || menuData.template.image_url || ''} 
                  alt={menuData.business?.name || menuData.template.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: menuData.business?.primary_color || design.accent }}
                >
                  {(menuData.business?.name || menuData.template.name).charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-bold text-lg" style={{ color: design.text }}>
                  {menuData.business?.name || menuData.template.name}
                </h2>
                {/* Show branch name if different from business name */}
                {menuData.business?.branch_name && menuData.business.branch_name !== menuData.business.name && (
                  <div className="text-sm font-medium opacity-80" style={{ color: design.text }}>
                    {menuData.business.branch_name}
                  </div>
                )}
                {menuData.business?.cuisine_type && (
                  <div className="flex items-center gap-1 text-sm opacity-70" style={{ color: design.text }}>
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>{menuData.business.cuisine_type}</span>
                  </div>
                )}
                {!menuData.business?.cuisine_type && !menuData.business?.branch_name && (
                  <div className="flex items-center gap-1 text-sm opacity-70" style={{ color: design.text }}>
                    <MapPin className="w-3 h-3" />
                    <span>{menuData.endpoint.name}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 rounded-full text-white"
              style={{ backgroundColor: design.accent }}
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>

          {/* Business Description */}
          {menuData.business?.description && (
            <p className="text-sm opacity-70 mb-4" style={{ color: design.text }}>
              {menuData.business.description}
            </p>
          )}

          {/* Business Contact Info */}
          {menuData.business && (menuData.business.phone || menuData.business.website) && (
            <div className="flex flex-wrap gap-3 mb-4">
              {menuData.business.phone && (
                <a 
                  href={`tel:${menuData.business.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: design.card, color: design.text }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  {menuData.business.phone}
                </a>
              )}
              {menuData.business.website && (
                <a 
                  href={menuData.business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: design.card, color: design.text }}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
            </div>
          )}

          {/* Address */}
          {menuData.business?.address && menuData.business.address.length > 0 && (
            <div className="flex items-start gap-1.5 text-sm opacity-60 mb-4" style={{ color: design.text }}>
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{menuData.business.address.join(', ')}</span>
            </div>
          )}

          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: design.text }}>
            {greeting}
          </h1>
          <p className="text-base sm:text-lg opacity-70 mb-4 sm:mb-5 md:mb-6" style={{ color: design.text }}>
            What would you like today?
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: design.accent }}>
                {totalItems}+
              </div>
              <div className="text-[10px] sm:text-xs opacity-60" style={{ color: design.text }}>ITEMS</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold flex items-center gap-1" style={{ color: design.accent }}>
                4.9 <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              </div>
              <div className="text-[10px] sm:text-xs opacity-60" style={{ color: design.text }}>RATING</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold" style={{ color: design.accent }}>
                ~5m
              </div>
              <div className="text-[10px] sm:text-xs opacity-60" style={{ color: design.text }}>WAIT</div>
            </div>
          </div>
        </div>
      </header>

      {/* Offers Banner */}
      {menuData.offers.length > 0 && (
        <div className="max-w-lg mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3">
              {menuData.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex-shrink-0 p-4 rounded-2xl min-w-[280px]"
                  style={{ 
                    backgroundColor: design.accent,
                    color: 'white'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                      Special Offer
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{offer.name}</h3>
                  {offer.description && (
                    <p className="text-sm opacity-80">{offer.description}</p>
                  )}
                  {offer.discount_type === 'percentage' && (
                    <div className="mt-2 text-2xl font-bold">{offer.discount_value}% OFF</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Picks Section */}
      {topPicks.length > 0 && (
        <section className="max-w-lg mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: design.text }}>
            Top Picks for You
          </h2>
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-4">
              {topPicks.map((item) => {
                const price = getItemPrice(item, menuData.overrides);
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex-shrink-0 w-40 rounded-2xl overflow-hidden shadow-sm"
                    style={{ backgroundColor: design.card }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-32 flex items-center justify-center text-5xl"
                        style={{ backgroundColor: design.card, opacity: 0.8 }}
                      >
                        {item.icon || DEFAULT_ITEM_ICON}
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1" style={{ color: design.text }}>
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold" style={{ color: design.accent }}>
                          {symbol}{formatPrice(price)}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: design.accent }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Category Navigation */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ backgroundColor: design.bg + 'ee' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex overflow-x-auto py-3 px-4 gap-2 scrollbar-hide">
            {menuData.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category.name ? 'text-white shadow-md' : ''
                }`}
                style={
                  activeCategory === category.name
                    ? { backgroundColor: design.accent }
                    : { backgroundColor: design.card, color: design.text }
                }
              >
                {category.icon && <span className="mr-1.5">{category.icon}</span>}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu Section */}
      <section className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: design.text }}>
          Menu
        </h2>
        <div className="space-y-4">
          {activeItems.map((item) => {
            const available = isItemAvailable(item, menuData.overrides);
            const price = getItemPrice(item, menuData.overrides);
            const cartItem = getCartItem(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 p-4 rounded-2xl shadow-sm ${!available ? 'opacity-50' : ''}`}
                style={{ backgroundColor: design.card }}
              >
                {/* Image/Icon */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-28 h-28 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div 
                    className="w-28 h-28 rounded-xl flex-shrink-0 flex items-center justify-center text-5xl"
                    style={{ backgroundColor: design.bg }}
                  >
                    {item.icon || DEFAULT_ITEM_ICON}
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold line-clamp-1" style={{ color: design.text }}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      {item.is_spicy && <Flame className="w-4 h-4 text-red-500" />}
                      {item.dietary_info?.includes('vegetarian') && (
                        <Leaf className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm opacity-60 line-clamp-2 mb-2" style={{ color: design.text }}>
                      {item.description}
                    </p>
                  )}

                  {item.preparation_time && (
                    <div className="flex items-center gap-1 text-xs opacity-50 mb-2" style={{ color: design.text }}>
                      <Clock className="w-3 h-3" />
                      {item.preparation_time} min
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold" style={{ color: design.accent }}>
                        {symbol}{formatPrice(price)}
                      </span>
                      {item.compare_at_price && Number(item.compare_at_price) > price && (
                        <span className="ml-2 text-sm line-through opacity-50" style={{ color: design.text }}>
                          {symbol}{formatPrice(item.compare_at_price)}
                        </span>
                      )}
                    </div>

                    {available ? (
                      cartItem ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                            style={{ borderColor: design.accent, color: design.accent }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold" style={{ color: design.text }}>
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: design.accent }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-5 py-2 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: design.accent }}
                        >
                          Add
                        </button>
                      )
                    ) : (
                      <span className="text-sm opacity-50" style={{ color: design.text }}>
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-sm opacity-50" style={{ color: design.text }}>
          Powered by MenuVibe
        </p>
      </footer>

      {/* Floating Cart Bar */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <motion.button
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full py-4 px-6 rounded-2xl flex items-center justify-between text-white shadow-xl"
              style={{ backgroundColor: design.accent }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">{getCartCount()} items</div>
                  <div className="text-xs opacity-80">View your order</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{symbol}{formatPrice(getCartTotal())}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
              style={{ backgroundColor: design.card }}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: design.text }}>Your Order</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="opacity-50" style={{ color: design.text }}>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((cartItem) => (
                      <div key={cartItem.item.id} className="flex items-center gap-4">
                        {cartItem.item.image_url ? (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : cartItem.item.icon ? (
                          <div className="w-16 h-16 rounded-xl bg-neutral-200 flex items-center justify-center text-2xl">
                            {cartItem.item.icon}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-neutral-200" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold" style={{ color: design.text }}>
                            {cartItem.item.name}
                          </h3>
                          <p className="font-bold" style={{ color: design.accent }}>
                            {symbol}{formatPrice(getItemPrice(cartItem.item, menuData.overrides))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-bold">{cartItem.quantity}</span>
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
                    <span className="text-lg" style={{ color: design.text }}>Total</span>
                    <span className="text-2xl font-bold" style={{ color: design.accent }}>
                      {symbol}{formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <button
                    className="w-full py-4 rounded-xl text-white font-bold text-lg"
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
